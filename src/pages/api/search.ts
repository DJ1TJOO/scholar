// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	fetch(
		`https://serpapi.com/search?engine=google_scholar&api_key=${process.env.SCHOLAR_KEY}&` +
			Object.keys(req.query)
				.map((x) => `${x}=${req.query[x]}`)
				.join('&'),
	)
		.then((res) => res.json())
		.then((serp) => {
			res.setHeader('Cache-Control', 's-maxage=86400');
			res.json(serp);
		})
		.catch(() => res.status(500).json({ error: 'internal server error' }));
}
