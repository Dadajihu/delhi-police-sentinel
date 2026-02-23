import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        const { media_url, report_id, user_comment } = await req.json();

        if (!media_url) {
            return NextResponse.json({ error: 'Missing media_url' }, { status: 400 });
        }

        console.log(`Analyzing evidence for report ${report_id}...`);

        // 1. Sightengine Authenticity Check
        // Using sightengine api to detect AI generated content or manipulation.
        // Example from docs: 'models=genai'
        let authenticity_score = 1.0; // Default to assumed real (1.0 = real, 0.0 = fake)
        try {
            if (process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET) {
                console.log("Calling Sightengine Authenticity Check...");
                const url = `https://api.sightengine.com/1.0/check.json?url=${encodeURIComponent(media_url)}&models=genai&api_user=${process.env.SIGHTENGINE_API_USER}&api_secret=${process.env.SIGHTENGINE_API_SECRET}`;

                const sightResp = await fetch(url);
                const sightData = await sightResp.json();

                // If the check was successful, the response contains a 'type' object with an 'ai_generated' score
                if (sightData.status === 'success' && sightData.type && typeof sightData.type.ai_generated === 'number') {
                    // ai_generated is a float from 0 to 1 where 1 is highly likely to be AI.
                    // Our authenticity_score is the inverse: 1.0 is real, 0.0 is fake.
                    authenticity_score = 1.0 - sightData.type.ai_generated;
                } else if (sightData.status === 'failure') {
                    console.error("Sightengine returned error:", sightData.error?.message || "Unknown error");
                    // We fallback to 0.95 to keep the app working gracefully without completely failing
                    authenticity_score = 0.95;
                }
            } else {
                console.warn("Sightengine keys missing, simulating authenticity passed.");
            }
        } catch (e: any) {
            console.error("Sightengine Error:", e.message);
        }

        // 2. Fetch the image buffer first (we need it for Gemini too)
        const mediaResponse = await fetch(media_url);
        const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
        const mimeType = mediaResponse.headers.get('content-type') || 'image/jpeg';

        // 3. Roboflow ANPR (Text Recognition Workflow)
        let plate_number = null;
        try {
            if (process.env.ROBOFLOW_API_KEY) {
                console.log("Calling Roboflow Workflow with URL:", media_url);
                const roboResp = await fetch('https://serverless.roboflow.com/madhus/workflows/text-recognition', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: process.env.ROBOFLOW_API_KEY,
                        inputs: {
                            image: { type: "url", value: media_url }
                        }
                    })
                });

                const roboData = await roboResp.json();
                console.log("Roboflow Raw Response:", JSON.stringify(roboData, null, 2));

                if (roboResp.ok) {
                    let extract = null;
                    try {
                        const str = JSON.stringify(roboData);

                        // Broad search for Indian plate formats:
                        // 2 letters + 2 numbers + 1-2 letters + 4 numbers
                        // e.g. DL 8C AB 1234, HR 26 CT 1871
                        // We remove spaces first for the regex to work better
                        const cleanedStr = str.replace(/\s+/g, '');
                        const plateMatch = cleanedStr.match(/([A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4})/i);

                        if (plateMatch && plateMatch[1]) {
                            extract = plateMatch[1].toUpperCase();
                        } else {
                            // Deep search for any 'text' or 'prediction' field
                            const findText = (obj: any): string | null => {
                                if (!obj || typeof obj !== 'object') return null;
                                if (typeof obj.text === 'string' && obj.text.length > 5) return obj.text;
                                for (const key in obj) {
                                    const res = findText(obj[key]);
                                    if (res) return res;
                                }
                                return null;
                            };
                            const deeper = findText(roboData);
                            if (deeper) {
                                // Clean the deeper find to see if it's a plate
                                const cleanDeeper = deeper.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                if (cleanDeeper.length >= 7 && cleanDeeper.length <= 11) {
                                    extract = cleanDeeper;
                                }
                            }
                        }
                    } catch (e) { }

                    if (extract) {
                        console.log("Successfully extracted plate from Roboflow:", extract);
                        plate_number = extract;
                    }
                } else {
                    console.error("Roboflow API returned error:", roboData.message || roboResp.statusText);
                }
            }
        } catch (e: any) {
            console.error("Roboflow Fetch Error:", e.message);
        }

        // 4. Gemini Vision (Basic Detection)
        // Extracting basic facts: Helmet, Signal Jumping, Wrong Side, Zebra Crossing.
        let extracted_data: any = {};
        let validity_score = 0.8;
        let priority_score = 0.75;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `
You are an expert traffic violation analyzer.
Analyze this traffic camera image / video frame carefully.
                ${user_comment ? `The user who reported this provided the following context: "${user_comment}". Consider this in your analysis.` : ''}
provide a JSON object containing the following boolean flags if you detect these specific violations, along with a confidence score(0.0 to 1.0) for each.
Also include a short "comment" field explaining exactly what you see and detailing whether a violation is present.
Critically, attempt to read the license plate of the primary vehicle in the scene. If you can read it, place it in the "license_plate" field as a clean, uppercase string without spaces (e.g. DL8CX9291). If you cannot read it entirely, return null for it.
Ensure the response is ONLY valid JSON.
{
                "no_helmet": { "detected": boolean, "confidence": number },
                "signal_jumping": { "detected": boolean, "confidence": number },
                "wrong_side_driving": { "detected": boolean, "confidence": number },
                "zebra_crossing_violation": { "detected": boolean, "confidence": number },
                "illegal_parking": { "detected": boolean, "confidence": number },
                "license_plate": "string or null",
                "comment": "your reasoning here"
            }

            IMPORTANT FOR THE 'comment' FIELD:
            - Make it extremely clear, concrete, and structured.
            - Say ONLY what is necessary. No conversational filler.
            - Use <b>bold</b> and <u>underline</u> for important keywords and status (e.g. <u><b>Detected</b></u>, <u><b>Not Found</b></u>, <u><b>N/A</b></u>, <u><b>Confirmed</b></u>).
            - Separate the reasoning into these exact sections using newlines:
              <u><b>Vehicle:</b></u> [description]
              <u><b>Environment:</b></u> [description]
              <u><b>Behavior:</b></u> [description]
              <u><b>Conclusion:</b></u> [summary]
            - Use <u><b>Violation Name</b></u> when referring to specific flags.
            `;

            const result = await model.generateContent([
                { inlineData: { data: mediaBuffer.toString("base64"), mimeType: mimeType } },
                prompt
            ]);

            const textStr = result.response.text();

            // Clean up json
            const jsonStr = textStr.replace(/```json/gi, '').replace(/```/g, '').trim();
            extracted_data = JSON.parse(jsonStr);

            console.log("Gemini detected plate:", extracted_data?.license_plate);

            // Favor Roboflow if it found a valid looking plate, otherwise use Gemini
            const looksLikePlate = (p: string | any) => typeof p === 'string' && p.length >= 7 && p.length <= 11 && /[A-Z]{2}[0-9]/.test(p);

            if (!looksLikePlate(plate_number) && looksLikePlate(extracted_data.license_plate)) {
                console.log("Using Gemini plate detection as fallback...");
                plate_number = extracted_data.license_plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
            } else if (looksLikePlate(plate_number)) {
                console.log("Prioritizing Roboflow plate detection:", plate_number);
            } else if (extracted_data.license_plate) {
                // Last ditch effort: use whatever Gemini found if Roboflow found absolutely nothing
                const geminiPlate = extracted_data.license_plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                plate_number = plate_number || geminiPlate;
            }

            // Calculate validity and priority dynamically based on AI extractions
            let highestConfidence = 0;
            let rawPriority = 0;
            const weights: any = {
                no_helmet: 0.6,
                signal_jumping: 0.9,
                wrong_side_driving: 1.0,
                zebra_crossing_violation: 0.4,
                illegal_parking: 0.3
            };

            Object.keys(weights).forEach(key => {
                if (extracted_data[key] && extracted_data[key].detected === true) {
                    const conf = extracted_data[key].confidence || 0;
                    if (conf > highestConfidence) highestConfidence = conf;
                    rawPriority += (weights[key] * conf); // Increase priority for multiple severe violations
                }
            });

            validity_score = highestConfidence > 0 ? highestConfidence : 0;

            // Priority is a factor of the severity of the violation, scaled by how authentic the image is.
            // A highly severe violation with a fake picture gets bumped down
            priority_score = parseFloat((Math.min(1.0, rawPriority) * authenticity_score).toFixed(2));

        } catch (e: any) {
            console.error("Gemini Error:", e.message);
            // Fallback simulated data if Gemini fails (e.g. from geo-blocks)
            extracted_data = {
                "signal_jumping": { "detected": false, "confidence": 0 },
                "no_helmet": { "detected": false, "confidence": 0 },
                "wrong_side_driving": { "detected": false, "confidence": 0 },
                "zebra_crossing_violation": { "detected": false, "confidence": 0 },
                "illegal_parking": { "detected": false, "confidence": 0 },
                "comment": "Simulated AI Fallback: The intelligence API failed to process the image correctly. Manual review advised."
            };
            validity_score = 0;
            priority_score = parseFloat((0.2 * authenticity_score).toFixed(2));
        }

        const analysis = {
            authenticity_score,
            plate_number,
            extracted_data,
            validity_score,
            priority_score,
            ai_explanation: extracted_data?.comment || null
        };

        const response = NextResponse.json({
            success: true,
            report_id,
            analysis: analysis
        });

        // Add CORS headers for mobile app access
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

        return response;

    } catch (error: any) {
        console.error('API Error:', error);
        const errorResponse = NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
        return errorResponse;
    }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
    const response = new NextResponse(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
}
