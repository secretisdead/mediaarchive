'use strict';

import { TagsField } from './tagsfield.js';
import { add_hover_preview } from './add_hover_preview.js';

document.documentElement.classList.add('scripts_enabled');

let target_input = document.getElementById('tags');
if (target_input) {
	let target_form = target_input.parentNode;
	let disallowed_search_tag_prefixes = [];
	// create tags field
	let tags_field = new TagsField(
		disallowed_search_tag_prefixes,
		target_input.dataset.placeholder,
		target_input.dataset.removeTag,
		target_input.value
	);
	// add classes to tags field components
	tags_field.preview.classList.add('tags_preview');
	// wrap tags field preview
	let preview_wrapper = document.createElement('div');
	preview_wrapper.classList.add('tags_preview_wrapper');
	preview_wrapper.append(tags_field.preview);
	// add tags field components to target form
	target_form.insertBefore(preview_wrapper, target_input);
	target_form.insertBefore(tags_field.input, target_input);
	// add submit listener to target form
	target_form.addEventListener('submit', e => {
		if (tags_field.input.value) {
			// commit any tag still in input
			tags_field.add_tags(tags_field.to_list(tags_field.input.value));
			tags_field.clear_input();
		}
		target_input.value = tags_field.to_string(tags_field.tags_list);
	});
	// add listener to swap negation and regular tags
	tags_field.input.addEventListener('added', e => {
		if ('-' == e.detail.tag[0]) {
			tags_field.remove_tag(e.detail.tag.substring(1));
		}
		else {
			tags_field.remove_tag('-' + e.detail.tag);
		}
	});
	// listener for search key
	window.addEventListener('keydown', e => {
		if (
			'INPUT' == document.activeElement.tagName
			|| 'TEXTAREA' == document.activeElement.tagName
		) {
			return;
		}
		if ('s' == e.key) {
			setTimeout(() => {
				tags_field.input.focus();
			}, 1);
		}
	});
	// listeners for add and remove tags on tags this page actions
	let actions = document.querySelectorAll('#tags_this_page .action');
	for (let i = 0; i < actions.length; i++) {
		let action = actions[i];
		actions[i].addEventListener('click', e => {
			e.preventDefault();
			if (actions[i].classList.contains('add')) {
				tags_field.add_tag(e.currentTarget.parentNode.dataset.tag);
			}
			else if (actions[i].classList.contains('remove')) {
				tags_field.add_tag('-' + e.currentTarget.parentNode.dataset.tag);
			}
		});
	}
	// fetch suggestions
	tags_field.fetch_suggestions();
}
let tags_this_page = document.querySelector('#tags_this_page');
if (tags_this_page) {
	tags_this_page.classList.add('closed');
	tags_this_page.querySelector('.header').addEventListener('click', e => {
		e.currentTarget.parentNode.classList.toggle('closed');
	});
}

// media preferences
let preferences_link = document.querySelector('.menu .preferences');
preferences_link.addEventListener('click', e => {
	document.body.classList.add('editing_preferences');
});
document.querySelector('#dim').addEventListener('click', (e) => {
	document.body.classList.remove('editing_preferences');
});
// get blacklisted tags
let blacklisted_tags = localStorage.getItem('blacklisted_tags');
if (blacklisted_tags) {
	blacklisted_tags = blacklisted_tags.split('#');
}
else {
	blacklisted_tags = [];
}
let blacklisted_tags_input = document.querySelector('#blacklisted_tags');
blacklisted_tags_input.value = blacklisted_tags.join('#');
// save preferences
document.querySelector('#media_preferences').addEventListener('submit', e => {
	localStorage.setItem('blacklisted_tags', blacklisted_tags_input.value);
	e.preventDefault();
	document.body.classList.remove('editing_preferences');
});

let thumbnails = document.querySelectorAll('.thumbnail');
for (let i = 0; i < thumbnails.length; i++) {
	let thumbnail = thumbnails[i];
	// thumbnail hover previews
	if (thumbnail.dataset.hasOwnProperty('preview')) {
		add_hover_preview(thumbnail);
	}
	// blacklisted tags
	for (let j = 0; j < blacklisted_tags.length; j++) {
		let blacklisted_tag = blacklisted_tags[j]
		if (
			thumbnail.title.includes('#' + blacklisted_tag + '#')
			|| '#' + blacklisted_tag == thumbnail.title.substring(thumbnail.title.length - (blacklisted_tag.length + 1))
		) {
			thumbnail.classList.add('blacklist');
		}
	}
}
