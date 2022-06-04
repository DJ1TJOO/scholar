export default class Scholar {
	private _cites: string | undefined;
	private _year_to: string | undefined;
	private _year_from: string | undefined;
	private _cluster: string | undefined;
	private _language: string | undefined;
	private _articleLanguage: string | undefined;
	private _start: number | undefined;
	private _articles: number | undefined;
	private _maxResults: number | undefined;
	private _searchType: number | undefined;
	private _filter: number | undefined;
	private _citations: number | undefined;
	private _safe: 'active' | 'off' | undefined;

	constructor() {}

	/**
	 * Defines unique ID for an article to trigger Cited By searches. Usage of cites will bring up a list of citing documents in Google Scholar. Example value: `cites=1275980731835430123`. Usage of cites and query triggers search within citing articles.
	 * @param cites
	 * @returns {Scholar}
	 */
	cites(cites: string) {
		this._cites = cites;
		return this;
	}

	/**
	 * Defines the year from which you want the results to be included. (e.g. if you set to parameter to the year 2018, the results after that year will be omitted.). This can be combined with the from parameter.
	 * @param year
	 * @returns {Scholar}
	 */
	to(year: string) {
		this._year_to = year;
		return this;
	}

	/**
	 * Defines the year from which you want the results to be included. (e.g. if you set from parameter to the year 2018, the results before that year will be omitted.). This can be combined with the to parameter.
	 * @param year
	 * @returns {Scholar}
	 */
	from(year: string) {
		this._year_from = year;
		return this;
	}

	/**
	 * Defines articles added in the last year, sorted by date. It can be set to `1` to include only abstracts, or `2` to include everything. The default value is `0` which means that the articles are sorted by relevance.
	 * @param articles
	 * @returns {Scholar}
	 */
	articles(articles: number) {
		this._articles = articles;
		return this;
	}

	/**
	 * Parameter defines unique ID for an article to trigger All Versions searches. Example value: `cluster=1275980731835430123`. Usage of cluster together with `q` and `cites` parameters is prohibited. Use `cluster` parameter only.
	 * @param cluster
	 * @returns {Scholar}
	 */
	cluster(cluster: string) {
		this._cluster = cluster;
		return this;
	}

	/**
	 * Defines the language to use for the Google Scholar search. It's a two-letter language code. (e.g., `en` for English, `es` for Spanish, or `fr` for French) Head to the {@link https://serpapi.com/google-languages | Google languages} for a full list of supported Google languages.
	 * @param language
	 * @returns {Scholar}
	 */
	language(language: string) {
		this._language = language;
		return this;
	}

	/**
	 * Defines one or multiple languages to limit the search to. It uses `lang_{two-letter language code}` to specify languages and `|` as a delimiter. (e.g., `lang_fr|lang_de` will only search French and German pages). Head to the {@link https://serpapi.com/google-lr-languages | Google lr languages} for a full list of supported languages.
	 * @param language
	 * @returns {Scholar}
	 */
	articleLanguage(language: string) {
		this._articleLanguage = language;
		return this;
	}

	/**
	 * Defines the result offset. It skips the given number of results. It's used for pagination. (e.g., `0` (default) is the first page of results, `10` is the 2nd page of results, `20` is the 3rd page of results, etc.).
	 * @param start
	 * @returns {Scholar}
	 */
	start(start: number) {
		this._start = start;
		return this;
	}

	/**
	 * Parameter defines the maximum number of results to return, limited to 20. (e.g., `10` (default) returns 10 results, `20` returns 20 results).
	 * @param maxResults
	 * @returns {Scholar}
	 */
	maxResults(maxResults: number) {
		this._maxResults = maxResults;
		return this;
	}

	/**
     * Can be used either as a search type or a filter.

        As a Filter (only works when searching articles):
        `0` - exclude patents (default).
        `7` - include patents.

        As a Search Type:
        `4` - Select case law (US courts only). This will select all the State and Federal courts.
        e.g. `as_sdt=4` - Selects case law (all courts)

        To select specific courts, see the full list of supported Google Scholar courts.
        e.g. `as_sdt=4,33,192` - `4` is the required value and should always be in the first position, `33` selects all New York courts and `192` selects Tax Court.
        Values have to be separated by comma (`,`)
     * @param searchType 
     * @returns {Scholar}
     */
	searchType(searchType: number) {
		this._searchType = searchType;
		return this;
	}

	/**
	 * Defines the level of filtering for adult content. It can be set to `active`, or `off` (default).
	 * @param safe
	 * @returns {Scholar}
	 */
	safe(safe: 'active' | 'off') {
		this._safe = safe;
		return this;
	}

	/**
	 * Defines if the filters for 'Similar Results' and 'Omitted Results' are on or off. It can be set to `1` (default) to enable these filters, or `0` to disable these filters.
	 * @param filter
	 * @returns {Scholar}
	 */
	filter(filter: number) {
		this._filter = filter;
		return this;
	}

	/**
	 * Defines whether you would like to include citations or not. It can be set to `1` to exclude these results, or `0` (default) to include them.
	 * @param citations
	 * @returns {Scholar}
	 */
	citations(citations: number) {
		this._citations = citations;
		return this;
	}

	/**
     * Parameter defines the query you want to search. You can also use helpers in your query such as: `author:`, or `source:`.

        Usage of `cites` parameter makes `q` optional. Usage of `cites` together with `q` triggers search within citing articles.

        Usage of `cluster` together with `q` and `cites` parameters is prohibited. Use cluster parameter only.
     * @param query 
     */
	search(query?: string) {
		const queries: Record<string, string> = {};

		if (query) {
			queries.q = query;
		}
		if (this._cites) {
			queries.cites = this._cites;
		}
		if (this._year_from) {
			queries.as_ylo = this._year_from;
		}
		if (this._year_to) {
			queries.as_yli = this._year_to;
		}
		if (this._articles) {
			queries.scisbd = this._articles.toString();
		}
		if (this._cluster) {
			queries.cluster = this._cluster;
		}
		if (this._language) {
			queries.hl = this._language;
		}
		if (this._articleLanguage) {
			queries.lr = this._articleLanguage;
		}
		if (this._start) {
			queries.start = this._start.toString();
		}
		if (this._maxResults) {
			queries.num = this._maxResults.toString();
		}
		if (this._searchType) {
			queries.as_sdt = this._searchType.toString();
		}
		if (this._safe) {
			queries.safe = this._safe;
		}
		if (this._filter) {
			queries.filter = this._filter.toString();
		}
		if (this._citations) {
			queries.as_vis = this._citations.toString();
		}

		return fetch(
			'/search?' +
				Object.keys(queries)
					.map((x) => `${x}=${queries[x]}`)
					.join('&'),
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			},
		)
			.then((x) => {
				console.log(x);
				return x;
			})
			.then((x) => x.json());
	}
}
