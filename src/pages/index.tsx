import { Popover, Transition } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/outline';

import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useMemo, useState } from 'react';
import Scholar from '../../serp-wrapper';
import * as PDFJS from 'pdfjs-dist';
PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.js`;
import { TextItem } from 'pdfjs-dist/types/src/display/api';

const navigation = [
	{ name: 'Features', href: '#' },
	{ name: 'About', href: '#' },
];

type result = {
	line_links: {
		cached_page_link?: string;
		serpapi_cite_link: string;
	};
	link: string;
	position: number;
	publication_info: { summary: string };
	resources: { title: string; file_format: string; link: string }[];

	result_id: string;
	snippet: string;
	title: string;
};

type resultText = result & {
	resource: string;
};

const Home: NextPage = () => {
	const router = useRouter();
	const { search } = router.query;

	const [query, setQuery] = useState(typeof search === 'string' ? search : '');
	const [result, setResult] = useState<result[]>([]);
	const [resultText, setResultText] = useState<Record<string, resultText>>({});

	const getArticles = async (offset: number): Promise<any[]> => {
		if (typeof search !== 'string') return [];

		const scholar = new Scholar();
		const results: {
			organic_results: result[];
		} = await scholar.articles(1).start(offset).maxResults(20).search(search);
		return results.organic_results.filter((x) => x.resources).filter((x) => x.resources.some((x) => x.file_format === 'PDF'));
	};

	useEffect(() => {
		if (typeof search !== 'string') return;

		(async () => {
			let offset = 0;
			const result = await getArticles(offset);
			while (result.length < 30) {
				offset += 20;
				result.push(...(await getArticles(offset)));
			}
			setResult(result);
		})();
	}, [search]);

	useEffect(() => {
		console.log(result);
		for (let i = 0; i < result.length; i++) {
			const itemResult = result[i];
			const resource = itemResult.resources.find((x) => x.file_format === 'PDF');
			if (!resource) continue;

			PDFJS.getDocument({
				url: `https://api.allorigins.win/raw?url=${encodeURIComponent(resource.link)}`,
			})
				.promise.then((pdf) => {
					let total = pdf.numPages;
					let pages: Record<number, string> = {};
					let complete = 0;

					for (let pagei = 1; pagei <= total; pagei++) {
						pdf.getPage(pagei).then(function (page) {
							let pageNumber = page.pageNumber;
							page.getTextContent({
								includeMarkedContent: false,
								disableCombineTextItems: false,
							}).then(function (textContent) {
								if (null != textContent.items) {
									let page_text = '';
									let last_item = null;
									for (let itemsi = 0; itemsi < textContent.items.length; itemsi++) {
										let item = textContent.items[itemsi] as TextItem;
										// I think to add whitespace properly would be more complex and
										// would require two loops.
										if (last_item != null && last_item.str[last_item.str.length - 1] != ' ') {
											let itemX = item.transform[5];
											let lastItemX = last_item.transform[5];
											let itemY = item.transform[4];
											let lastItemY = last_item.transform[4];
											if (itemX < lastItemX) page_text += '\r\n';
											else if (itemY != lastItemY && last_item.str.match(/^(\s?[a-zA-Z])$|^(.+\s[a-zA-Z])$/) == null) page_text += ' ';
										} // ends if may need to add whitespace

										page_text += item.str;
										last_item = item;
									} // ends for every item of text

									// textContent != null && console.log('page ' + pageNumber + ' finished.'); // " content: \n" + page_text);
									pages[pageNumber] = page_text + '\n\n';
								} // ends if has items

								++complete;

								// If all done, put pages in order and combine all
								// text, then pass that to the callback
								if (complete == total) {
									// Using `setTimeout()` isn't a stable way of making sure
									// the process has finished. Watch out for missed pages.
									// A future version might do this with promises.
									setTimeout(function () {
										let full_text = '';
										let num_pages = Object.keys(pages).length;
										for (let pageNum = 1; pageNum <= num_pages; pageNum++) full_text += pages[pageNum];
										setResultText({
											...resultText,
											[itemResult.result_id]: {
												...itemResult,
												resource: full_text,
											},
										});
									}, 1000);
								}
							}); // ends page.getTextContent().then
						}); // ends page.then
					} // ends for every page
				})
				.catch((x) => console.log(x));
		}
	}, [result]);

	useEffect(() => {
		console.log(Object.keys(resultText).length);
	}, [resultText]);

	return (
		<div className="relative overflow-hidden">
			<Popover as="header" className="relative">
				<div className="bg-gray-900 pt-6">
					<nav className="relative max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6" aria-label="Global">
						<div className="flex items-center flex-1">
							<div className="flex items-center justify-between w-full md:w-auto">
								<a href="#">
									<span className="sr-only">Workflow</span>
									<img className="h-8 w-auto sm:h-10" src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg" alt="" />
								</a>
								<div className="-mr-2 flex items-center md:hidden">
									<Popover.Button className="bg-gray-900 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus-ring-inset focus:ring-white">
										<span className="sr-only">Open main menu</span>
										<MenuIcon className="h-6 w-6" aria-hidden="true" />
									</Popover.Button>
								</div>
							</div>
							<div className="hidden space-x-8 md:flex md:ml-10">
								{navigation.map((item) => (
									<a key={item.name} href={item.href} className="text-base font-medium text-white hover:text-gray-300">
										{item.name}
									</a>
								))}
							</div>
						</div>
						<div className="hidden md:flex md:items-center md:space-x-6">
							<a
								href="#"
								className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
							>
								Start searching
							</a>
						</div>
					</nav>
				</div>

				<Transition
					as={Fragment}
					enter="duration-150 ease-out"
					enterFrom="opacity-0 scale-95"
					enterTo="opacity-100 scale-100"
					leave="duration-100 ease-in"
					leaveFrom="opacity-100 scale-100"
					leaveTo="opacity-0 scale-95"
				>
					<Popover.Panel focus className="absolute z-10 top-0 inset-x-0 p-2 transition transform origin-top md:hidden">
						<div className="rounded-lg shadow-md bg-white ring-1 ring-black ring-opacity-5 overflow-hidden">
							<div className="px-5 pt-4 flex items-center justify-between">
								<div>
									<img className="h-8 w-auto" src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg" alt="" />
								</div>
								<div className="-mr-2">
									<Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600">
										<span className="sr-only">Close menu</span>
										<XIcon className="h-6 w-6" aria-hidden="true" />
									</Popover.Button>
								</div>
							</div>
							<div className="pt-5 pb-6">
								<div className="px-2 space-y-1">
									{navigation.map((item) => (
										<a key={item.name} href={item.href} className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">
											{item.name}
										</a>
									))}
								</div>
								<div className="mt-6 px-5">
									<a href="#" className="block text-center w-full py-3 px-4 rounded-md shadow bg-indigo-600 text-white font-medium hover:bg-indigo-700">
										Start free trial
									</a>
								</div>
								<div className="mt-6 px-5">
									<p className="text-center text-base font-medium text-gray-500">
										Existing customer?{' '}
										<a href="#" className="text-gray-900 hover:underline">
											Login
										</a>
									</p>
								</div>
							</div>
						</div>
					</Popover.Panel>
				</Transition>
			</Popover>

			<main>
				<div className="pt-10 bg-gray-900 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
					<div className="mx-auto max-w-7xl lg:px-8">
						<div className="lg:grid lg:grid-cols-2 lg:gap-8">
							<div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
								<div className="lg:py-24">
									<h1 className="mt-4 text-4xl tracking-tight font-extrabold text-white sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
										<span className="block">A better way to</span>
										<span className="block text-indigo-400 md:mt-3">search scholar</span>
									</h1>
									<p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">Start searching now on multiple categories</p>
									<div className="mt-10 sm:mt-12">
										<div className="sm:flex">
											<div className="min-w-0 flex-1">
												<label htmlFor="search" className="sr-only">
													search
												</label>
												<input
													type="text"
													value={query}
													onChange={(e) => setQuery(e.target.value)}
													placeholder="Enter your search query"
													className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-gray-900"
												/>
											</div>
											<div className="mt-3 sm:mt-0 sm:ml-3">
												<button
													onClick={() => {
														router.push(
															'/',
															{
																query: {
																	search: query,
																},
															},
															{
																shallow: true,
															},
														);
													}}
													className="block w-full py-3 px-4 rounded-md shadow bg-indigo-500 text-white font-medium hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-gray-900"
												>
													Start searching
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div className="mt-12 -mb-16 sm:-mb-48 lg:m-0 lg:relative">
								<div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
									<img className="w-full lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none" src="home-icon.svg" alt="" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* More main page content here... */}
			</main>
		</div>
	);
};

export default Home;
