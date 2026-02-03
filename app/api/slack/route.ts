import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { message, payload } = await request.json();
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;

        if (!webhookUrl) {
            // Graceful degradation as requested
            return NextResponse.json({ success: false, error: 'Slack Webhook URL not configured in .env' }, { status: 200 });
        }

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }), // Simple text payload for webhook
        });

        if (!res.ok) {
            return NextResponse.json({ success: false, error: `Slack API error: ${res.statusText}` }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
