import DOMPurify from "isomorphic-dompurify";
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/html");

  const rawHtml = `<img src=x onerror="alert('XSS from /api/safe-html')" />`;
  const safeHtml = DOMPurify.sanitize(rawHtml);

  res.status(200).send(safeHtml);
}
