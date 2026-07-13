const NEXON_BASE_URL = "https://open.api.nexon.com/maplestory/v1";

function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

function normalizePathParam(pathParam) {
  if (!pathParam) return "";
  return Array.isArray(pathParam) ? pathParam.join("/") : pathParam;
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

export async function onRequestGet(context) {
  const apiKey = context.env.NEXON_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      { error: { message: "NEXON_API_KEY secret이 Cloudflare Pages에 설정되지 않았습니다." } },
      500
    );
  }

  const path = normalizePathParam(context.params.path);
  const requestUrl = new URL(context.request.url);
  const upstreamUrl = new URL(`${NEXON_BASE_URL}/${path}`);
  upstreamUrl.search = requestUrl.search;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-nxopen-api-key": apiKey
      }
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
        "access-control-allow-origin": "*"
      }
    });
  } catch (error) {
    return jsonResponse(
      { error: { message: `넥슨 API 프록시 요청 실패: ${error.message}` } },
      502
    );
  }
}
