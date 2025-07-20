import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/html");
  res.send(`<img src=x onerror="alert('XSS from API')" />`);
}
