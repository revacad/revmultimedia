export async function sendMessage(
  phone: string,
  message: string,
  channel: "sms" | "whatsapp",
): Promise<{ skipped?: boolean; sent?: boolean; error?: string }> {
  const apiKey = process.env.SENTDM_API_KEY;

  if (!apiKey) {
    return { skipped: true };
  }

  try {
    const response = await fetch("https://api.sent.dm/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone,
        message,
        channel,
        sender_id: process.env.SENTDM_SENDER_ID ?? "RevAcademy",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { error: body || `Sent.dm request failed (${response.status})` };
    }

    return { sent: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Sent.dm error";
    return { error: errorMessage };
  }
}
