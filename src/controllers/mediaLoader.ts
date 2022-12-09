
const cache = {};
let delay = -1;
let debounce: number;

type getMediaProps<T> = {
	id: string;
	construct: (
		onLoad: () => void,
		onError: () => void,
		onAbort: () => void
	) => T;
	cleanup: (media: mediaType<T>) => void;
}

type getMediaReturn<T> = Promise<mediaType<T>>;

type mediaType<T> = T & {
	id: string;
	cached: boolean;
	loaded: boolean;
	cleanup: (media: mediaType<T>) => void;
};

let loading_count = 0;

export function getMedia<T>({ id, construct, cleanup }: getMediaProps<T>): getMediaReturn<T> {

	function onLoadStart(media: mediaType<T>) {
		media.loaded = false;
		loading_count++;
		// console.log(loading_count, "load start", filename(media.id));
	}

	function onLoadEnd(media: mediaType<T>) {
		media.loaded = true;
		loading_count--;
		// console.log(loading_count, "load end", filename(media.id));
	}

	return new Promise((resolve, reject) => {
		if (!id) {
			reject();
			return;
		}

		function _resolve(media) {
			if (delay < 0)
				resolve(media)
			else
				setTimeout(() => resolve(media), delay);

			delay++;
			clearTimeout(debounce);
			debounce = setTimeout(() => delay = -1);
		}

		function onLoad() {
			onLoadEnd(media);
			_resolve(media);
		}

		function onError() {
			// console.warn("onError!", filename(media.id));
		}

		function onAbort() {
			// console.warn("onAbort!", filename(media.id));
		}

		const media = (cache[id] ?? Object.assign(
			construct(onLoad, onError, onAbort), {
			id,
			cleanup,
			cached: false,
			loaded: false,
		})) as mediaType<T>

		cache[id] = media;

		if (media.loaded) {
			media.cached = true;
			_resolve(media);
		} else {
			onLoadStart(media);
		}
	});
}

export function cancelMedia<T>(id: string) {
	const media = cache[id] as mediaType<T>;

	if (media && !media.loaded) {
		media.cleanup(media);
		cache[id] = null;
		loading_count--;
		// console.log(loading_count, "cancel", filename(media.id));
	}
}

function filename(src) {
	return src.split("\\").at(-1)
}