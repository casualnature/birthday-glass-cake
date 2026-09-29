const ALLOWED_VIDEOS = new Set(["video-1.mp4", "video-2.mp4"]);

export async function onRequest(context) {
  const { request, env, params } = context;
  const key = Array.isArray(params.all) ? params.all.join("/") : (params.all || "");

  if (!ALLOWED_VIDEOS.has(key)) {
    return new Response("Not found", { status: 404 });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" }
    });
  }

  const object = await env.BIRTHDAY_GLASS_CAKE_MEDIA.get(key, {
    range: request.headers
  });

  if (object === null) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "video/mp4");
  headers.set("Accept-Ranges", "bytes");
  headers.set("ETag", object.httpEtag);

  const range = object.range;
  if (range) {
    const end = range.offset + range.length - 1;
    headers.set("Content-Range", `bytes ${range.offset}-${end}/${object.size}`);
    headers.set("Content-Length", String(range.length));
  } else {
    headers.set("Content-Length", String(object.size));
  }

  return new Response(request.method === "HEAD" ? null : object.body, {
    status: range ? 206 : 200,
    headers
  });
}
