export function getImageDataUrl(base64) {
  if (!base64) return null;
  const cleanBase64 = base64.replace(/^data:.*;base64,/, "");
  const signatures = [
    { type: "png", prefix: "iVBORw0KGgo" },
    { type: "jpeg", prefix: "/9j/" },
    { type: "webp", prefix: "UklGR" },
    { type: "gif", prefix: "R0lGOD" },
    { type: "bmp", prefix: "Qk" },
  ];
  const found = signatures.find((sig) => cleanBase64.startsWith(sig.prefix));
  const mime = found ? `image/${found.type}` : "image/jpeg";
  return `data:${mime};base64,${cleanBase64}`;
}


