export const dynamic = "force-static";

// RFC 9116 vulnerability-disclosure pointer.
export async function GET() {
  const body =
    "Contact: https://github.com/td1tdcosayt1234-creator/codebridge-mcp-web/security/advisories/new\n" +
    "Expires: 2027-12-31T00:00:00.000Z\n" +
    "Preferred-Languages: en\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
