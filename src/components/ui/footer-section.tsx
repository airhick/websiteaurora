'use client';
import { LinkedinIcon } from 'lucide-react';

export function Footer() {
	return (
		<footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl bg-gradient-to-b from-gray-100 to-transparent dark:from-gray-900 dark:to-transparent px-6 py-12 lg:py-16 transition-colors duration-300">
			<div className="bg-gray-400 dark:bg-gray-600 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur transition-colors duration-300" />

			<div className="flex items-center justify-center">
				<a
					href="https://www.linkedin.com/company/myaurora/about/"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-gray-900 dark:hover:text-white inline-flex items-center transition-all duration-300 text-gray-700 dark:text-gray-300"
				>
					<LinkedinIcon className="me-2 size-5" />
					<span>LinkedIn</span>
				</a>
			</div>
		</footer>
	);
};