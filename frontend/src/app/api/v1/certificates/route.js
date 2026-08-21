import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { apikey } = await req.json();
        if (!apikey) {
            return NextResponse.json({ error: "API key is required" }, { status: 400 });
        }

        const response = await axios.get("https://abc-api.edmingle.com/nuSource/api/v1/certificates/students", {
            headers: {
                "apikey": apikey,
                "ORGID": "3"
            }
        });

        const certData = response.data.payload.certificates || [];
        
        // Extracting certificate links
        const certificateLinks = certData.map(cert => cert[9]);
        
        return NextResponse.json({ certificates: certificateLinks }, { status: 200 });
    } catch (error) {
        console.error("Error fetching certificates:", error);
        return NextResponse.json({
            error: error.response?.data?.message || "Internal Server Error"
        }, { status: error.response?.status || 500 });
    }
}
