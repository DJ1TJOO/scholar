import { Disclosure, Combobox, Popover, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, MenuIcon, SelectorIcon, XIcon } from '@heroicons/react/outline';

import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useMemo, useState } from 'react';
import Scholar from '../../serp-wrapper';
import * as PDFJS from 'pdfjs-dist';
PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.js`;
import { TextItem } from 'pdfjs-dist/types/src/display/api';

import temp from './temp.json';

function classNames(...classes: any) {
	return classes.filter(Boolean).join(' ');
}

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
	words: { word: string; count: number }[];
	category?: {
		id: string;
		counted: number;
	};
};

type categorie = {
	id: string;
	title: string;
	words: string[];
};

const categories: categorie[] = [
	{
		id: 'waterkwaliteit',
		title: 'Waterkwaliteit',
		words: [
			'waterkwaliteit',
			'nitraatrichtlijn',
			'nitraatrapportage',
			'waderrichtlijn',
			'grondwaterkwaliteit',
			'oppervlaktewaterkwaliteit',
			'nitraat',
			'stikstof',
			'fosfor',
			'eutrofiëring',
			'ecosysteem',
		],
	},
	{
		id: 'drinkwater',
		title: 'Drinkwater',
		words: ['drinkwater', 'zoetwateropslag', 'waterarmoede', 'watertekort', 'waterverbruik', 'watervraag', 'zoetwaterbuffer', 'aquifer', 'onttrekking', 'concentratie'],
	},
	{
		id: 'waterveiligheid',
		title: 'Waterveiligheid',
		words: ['waterveiligheid', 'deltawerken', 'deltatechniek', 'dijken', 'zeespiegel', 'deltabeslissing', 'overstroming', 'waterkering', 'waterbeheer', 'bescherming'],
	},
];

const Home: NextPage = () => {
	const router = useRouter();
	const { search } = router.query;

	const [selected, setSelected] = useState('');
	const [query, setQuery] = useState(typeof search === 'string' ? search : '');
	const [resultText, setResultText] = useState<{ [key: string]: resultText }>(temp as unknown as { [key: string]: resultText });

	const getArticles = async (offset: number): Promise<any[]> => {
		if (typeof search !== 'string') return [];

		const scholar = new Scholar();
		const results: {
			organic_results: result[];
		} = await scholar.language('nl').articles(1).start(offset).maxResults(20).search(search);

		return results.organic_results.filter((x) => x.resources).filter((x) => x.resources.some((x) => x.file_format === 'PDF'));
	};

	// useEffect(() => {
	// 	if (typeof search !== 'string') return;

	// 	(async () => {
	// 		let offset = 0;
	// 		const result: result[] = await getArticles(offset);
	// 		while (result.length < 30) {
	// 			offset += 20;
	// 			result.push(...(await getArticles(offset)));
	// 		}

	// 		const newResultText = resultText;
	// 		for (let i = 0; i < result.length; i++) {
	// 			const itemResult = result[i];
	// 			const resource = itemResult.resources.find((x) => x.file_format === 'PDF');
	// 			if (!resource) continue;

	// 			try {
	// 				const resultText = await new Promise((resolve: (value: resultText) => void, reject) => {
	// 					PDFJS.getDocument({
	// 						url: `https://corsproxy.io/?${encodeURIComponent(resource.link)}`,
	// 					})
	// 						.promise.then((pdf) => {
	// 							let total = pdf.numPages;
	// 							let pages: Record<number, string> = {};
	// 							let complete = 0;

	// 							for (let pagei = 1; pagei <= total; pagei++) {
	// 								pdf.getPage(pagei).then(function (page) {
	// 									let pageNumber = page.pageNumber;
	// 									page.getTextContent({
	// 										includeMarkedContent: false,
	// 										disableCombineTextItems: false,
	// 									}).then(function (textContent) {
	// 										if (null != textContent.items) {
	// 											let page_text = '';
	// 											let last_item = null;
	// 											for (let itemsi = 0; itemsi < textContent.items.length; itemsi++) {
	// 												let item = textContent.items[itemsi] as TextItem;
	// 												// I think to add whitespace properly would be more complex and
	// 												// would require two loops.
	// 												if (last_item != null && last_item.str[last_item.str.length - 1] != ' ') {
	// 													let itemX = item.transform[5];
	// 													let lastItemX = last_item.transform[5];
	// 													let itemY = item.transform[4];
	// 													let lastItemY = last_item.transform[4];
	// 													if (itemX < lastItemX) page_text += '\r\n';
	// 													else if (itemY != lastItemY && last_item.str.match(/^(\s?[a-zA-Z])$|^(.+\s[a-zA-Z])$/) == null) page_text += ' ';
	// 												} // ends if may need to add whitespace

	// 												page_text += item.str;
	// 												last_item = item;
	// 											} // ends for every item of text

	// 											// textContent != null && console.log('page ' + pageNumber + ' finished.'); // " content: \n" + page_text);
	// 											pages[pageNumber] = page_text + '\n\n';
	// 										} // ends if has items

	// 										++complete;

	// 										// If all done, put pages in order and combine all
	// 										// text, then pass that to the callback
	// 										if (complete == total) {
	// 											// Using `setTimeout()` isn't a stable way of making sure
	// 											// the process has finished. Watch out for missed pages.
	// 											// A future version might do this with promises.
	// 											setTimeout(function () {
	// 												let full_text = '';
	// 												let num_pages = Object.keys(pages).length;
	// 												for (let pageNum = 1; pageNum <= num_pages; pageNum++) full_text += pages[pageNum];

	// 												const wordCounts: Record<string, number> = {};
	// 												const words = full_text.split(/\b/);

	// 												for (var i = 0; i < words.length; i++) {
	// 													const word = words[i].toLowerCase();
	// 													wordCounts[word] = (wordCounts[word] || 0) + 1;
	// 												}

	// 												const wordsArray = Object.keys(wordCounts).map((x) => ({ word: x, count: wordCounts[x] }));
	// 												wordsArray.sort((a, b) => b.count - a.count);
	// 												resolve({
	// 													...itemResult,
	// 													resource: full_text,
	// 													words: wordsArray,
	// 												});
	// 											}, 1000);
	// 										}
	// 									}); // ends page.getTextContent().then
	// 								}); // ends page.then
	// 							} // ends for every page
	// 						})
	// 						.catch((x) => reject(x));
	// 				});
	// 				newResultText[itemResult.result_id] = resultText;
	// 			} catch (error) {}
	// 		}

	// 		for (const key in newResultText) {
	// 			const resultText = newResultText[key];
	// 			let currentCategorie = { id: '', counted: 0 };
	// 			for (let i = 0; i < categories.length; i++) {
	// 				const categorie = categories[i];

	// 				const words = resultText.words.filter((x) => categorie.words.some((y) => x.word.includes(y)));
	// 				const counted = words.reduce((partialSum, x) => partialSum + x.count, 0);
	// 				if (counted > currentCategorie.counted) {
	// 					currentCategorie = {
	// 						id: categorie.id,
	// 						counted,
	// 					};
	// 				}
	// 			}

	// 			if (currentCategorie.counted > 0) resultText.category = currentCategorie;
	// 		}

	// 		setResultText(newResultText);
	// 		console.log(newResultText);
	// 	})();
	// }, [search]);

	return (
		<>
			<div className="relative overflow-hidden">
				<header className="relative">
					<div className="bg-gray-900 pt-16"></div>
				</header>

				<main>
					<div className="pt-10 bg-gray-900 sm:pt-16 lg:pt-8 lg:pb-14">
						<div className="mx-auto max-w-7xl lg:px-8">
							<div className="lg:grid lg:grid-cols-2 lg:gap-8">
								<div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center">
									<div className="lg:py-24">
										<h1 className="mt-4 text-4xl tracking-tight font-bold text-white sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
											<span className="">
												Een <span className=" text-indigo-400">betere</span> manier om <span className=" text-indigo-400">scholar</span> te{' '}
												<span className=" text-indigo-400">zoeken</span>
											</span>
										</h1>
										<p className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">Begin nu met zoeken in meerdere categorieën</p>
										<div className="mt-10 sm:mt-12">
											<div className="sm:flex">
												<div className="min-w-0 flex-1">
													<Combobox value={selected} onChange={setSelected}>
														<div className="relative">
															<Combobox.Button className="relative w-full cursor-default rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
																<Combobox.Input
																	className="block w-full px-4 py-3 rounded-md border-0 text-base text-gray-900 placeholder-gray-500 outline-none"
																	value={query}
																	onChange={(e: any) => {
																		setQuery(e.target.value);
																		setSelected(e.target.value);
																	}}
																/>
																<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
																	<SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
																</span>
															</Combobox.Button>
															<Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
																<Combobox.Options className="z-40 absolute mt-1 max-h-[30rem] w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
																	{categories.map((categorie, i) => {
																		return (
																			<>
																				<Disclosure>
																					{({ open }: { open: boolean }) => (
																						<>
																							<Disclosure.Button className="flex w-full justify-between py-2 pl-4 pr-4 text-left text-sm font-medium  hover:bg-indigo-400 hover:text-white">
																								<span className={`inline-block truncate font-semibold`}>{categorie.title}</span>{' '}
																								{open ? (
																									<ChevronDownIcon className="inline-block w-4 h-4" />
																								) : (
																									<ChevronUpIcon className="inline-block w-4 h-4" />
																								)}
																							</Disclosure.Button>
																							<Disclosure.Panel className="">
																								{categorie.words.map((word, index) => (
																									<Combobox.Option
																										key={word + index}
																										className={({ active }) =>
																											`relative cursor-default select-none py-2 pl-10 pr-4 ${
																												active ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'
																											}`
																										}
																										value={word}
																									>
																										{({ selected }) => (
																											<>
																												<span
																													className={`block truncate ${
																														selected ? 'font-medium' : 'font-normal'
																													}`}
																												>
																													{word}
																												</span>
																												{selected ? (
																													<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indgo-400">
																														<CheckIcon className="h-5 w-5" aria-hidden="true" />
																													</span>
																												) : null}
																											</>
																										)}
																									</Combobox.Option>
																								))}
																							</Disclosure.Panel>
																						</>
																					)}
																				</Disclosure>
																			</>
																		);
																	})}
																</Combobox.Options>
															</Transition>
														</div>
													</Combobox>
												</div>
												<div className="mt-3 sm:mt-0 sm:ml-3">
													<button
														onClick={() => {
															window.location.href = '/?search=' + selected;
														}}
														className="block w-full py-3 px-4 rounded-md shadow bg-indigo-500 text-white font-medium hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-gray-900"
													>
														Begin met zoeken
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="mt-12 -mb-16 sm:-mb-48 lg:m-0 lg:relative ">
									<div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
										<img className="w-full lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none" src="home-icon.svg" alt="" />
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className={classNames('px-10 bg-gray-900 min-h-[20rem] pb-10', !search && 'hidden')} id="result">
						<h2 className="font-medium leading-tight text-4xl mt-0 mb-2 text-indigo-600">Resultaten voor: &apos;{search}&apos;</h2>
						{Object.keys(resultText).length < 1 ? (
							<h3 className="font-medium leading-tight text-3xl mt-0 mb-2 text-indigo-400">Laden...</h3>
						) : (
							<>
								{categories.map((category) => (
									<div className="mt-4" key={category.id}>
										<h3 className="font-medium leading-tight text-3xl mt-0 text-indigo-400">{category.title}</h3>
										<ul className="list-disc ml-6">
											{Object.values(resultText)
												.filter((x) => x.category?.id === category.id)
												.sort((a, b) => (b.category?.counted || 0) - (a.category?.counted || 0))
												.map((result) => (
													<li
														key={result.result_id}
														onClick={() =>
															result.resources.find((x) => x.file_format === 'PDF') &&
															router.push(result.resources.find((x) => x.file_format === 'PDF')!.link)
														}
														className="text-white mb-2 cursor-pointer"
													>
														<a href={result.resources.find((x) => x.file_format === 'PDF')!.link}>
															<div className="font-medium text-lg">{result.title}</div>
															<div className="-mt-2">Overeenkomende woorden: {result.category?.counted}</div>
														</a>
													</li>
												))}
										</ul>
									</div>
								))}
								<div>
									<h3 className="font-medium leading-tight text-3xl mt-0 mb-2 text-indigo-400">Overig</h3>
									<ul className="list-disc ml-6">
										{Object.values(resultText)
											.filter((x) => !x.category)
											.map((result) => (
												<li key={result.result_id} className="text-white mb-2 cursor-pointer">
													<a href={result.resources.find((x) => x.file_format === 'PDF')!.link}>
														<div className="font-medium">{result.title}</div>
														<div>{result.category?.counted}</div>
													</a>
												</li>
											))}
									</ul>
								</div>
							</>
						)}
					</div>
				</main>
			</div>
			<div className={classNames('-z-10 top-0 left-0 absolute bg-gray-900 h-screen w-screen', search && 'hidden')}></div>
		</>
	);
};

export default Home;
