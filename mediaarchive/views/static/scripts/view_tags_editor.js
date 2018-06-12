'use strict';

import { TagsField } from './tagsfield.js';
import { disallowed_edit_tag_prefixes } from './disallowed_edit_tag_prefixes.js';
import { autocopy } from './autocopy.js';

document.documentElement.classList.add('scripts_enabled');

function count_visible_tags(tags_list) {
	let visible_tags = 0;
	for (let i = 0; i < tags_list.length; i++) {
		let tag = tags_list[i];
		if (
			'filename:' != tag.substring(0, 9)
			&& 'set:' != tag.substring(0, 4)
			&& 'cover:' != tag.substring(0, 6)
			&& 'mirror:' != tag.substring(0, 7)
			&& 'superior of:' != tag.substring(0, 12)
			&& 'inferior of:' != tag.substring(0, 12)
			&& 'next:' != tag.substring(0, 5)
			&& 'prev:' != tag.substring(0, 5)
			&& 'suppress:' != tag.substring(0, 9)
		) {
			visible_tags++;
		}
	}
	return visible_tags;
}

let plain_tags_editor = document.querySelector('.tags_editor');
let target_input = plain_tags_editor.querySelector('[name="tags"]');
if (target_input) {
	let target_form = target_input.parentNode;
	// create tags field
	let tags_field = new TagsField(
		disallowed_edit_tag_prefixes,
		plain_tags_editor.dataset.placeholder,
		plain_tags_editor.dataset.removeTag
	);
	// add classes to tags field components
	tags_field.preview.classList.add('tags_preview');
	// wrap tags field preview
	let preview_wrapper = document.createElement('div');
	preview_wrapper.classList.add('tags_preview_wrapper');
	preview_wrapper.append(tags_field.preview);
	// add tags field components to target form
	target_form.insertBefore(preview_wrapper, tags_field.target_input);
	target_form.insertBefore(tags_field.input, tags_field.target_input);

	// show handler
	tags_field.show = function() {
		this.clear();
		this.add_tags(this.to_list(this.target_input.value));
		setTimeout(() => {
			this.input.focus();
		}, 1);
		document.body.classList.add('editing_tags');
	}.bind(tags_field);
	// save handler
	tags_field.save = function() {
		if (this.input.value) {
			// commit any tag still in input
			this.add_tags(this.to_list(this.input.value));
			this.clear_input();
		}
		// disable tag field and change placeholder
		this.input.disabled = true;
		this.input.placeholder = plain_tags_editor.dataset.savingPlaceholder;
		// send xhr
		let fd = new FormData();
		fd.append(this.target_input.name, this.to_string(this.tags_list));
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				// re-enable tag field and restore placeholder
				this.input.disabled = false;
				this.input.placeholder = this.placeholder;
				if (200 == xhr.status) {
					this.target_input.value = this.to_string(this.tags_list);
					let inner_tags = document.querySelector('.inner_tags');
					inner_tags.innerHTML = '';
					this.tags_list.sort();
					let visible_tags = count_visible_tags(this.tags_list);
					// build tags
					for (let i = 0; i < this.tags_list.length; i++) {
						let tag = this.tags_list[i];
						let el = this.create_tag_element(
							tag,
							plain_tags_editor.dataset.searchTagTitle,
							plain_tags_editor.dataset.searchUri
						);
						// add newly built tag to actual tags container
						inner_tags.appendChild(el);
					}
					inner_tags.parentNode.dataset.visibleTags = visible_tags;
					this.clear();
					document.body.classList.remove('editing_tags');
				}
				else {
					alert(plain_tags_editor.dataset.problemSaving);
				}
			}
		};
		let method = target_form.method.toUpperCase();
		let action = target_form.action;
		xhr.open(method, action + (-1 != action.indexOf('?') ? '&' : '?') + '_' + new Date().getTime(), true);
		xhr.withCredentials = true;
		xhr.send(fd);
	}.bind(tags_field);
	// discard handler
	tags_field.discard = function() {
		if (this.input.disabled) {
			e.stopPropagation();
			alert(plain_tags_editor.dataset.savingInProgress);
			return;
		}
		this.clear();
		document.body.classList.remove('editing_tags');
	}.bind(tags_field);

	// insert tag editor controls into info bar
	let info = document.querySelector('.info');
	// create editor controls
	let controls = {
		show: null,
		copy: null,
		save: null,
		discard: null,
	};
	for (let control in controls) {
		controls[control] = document.createElement('span');
		controls[control].innerText = plain_tags_editor.dataset[control + 'Link'];
		controls[control].classList.add('tag_editor_control');
		info.insertBefore(controls[control], info.childNodes[1]);
	}
	controls.show.classList.add('show_tag_editor');
	// listener for management keys
	window.addEventListener('keydown', e => {
		if ('Escape' == e.key) {
			tags_field.discard();
			return;
		}
		if (
			'INPUT' == document.activeElement.tagName
			|| 't' != e.key
		) {
			return;
		}
		tags_field.show();
	});
	// add controls listeners
	controls.show.addEventListener('click', e => {
		tags_field.show();
	});
	controls.save.addEventListener('click', e => {
		tags_field.save();
	});
	target_form.addEventListener('submit', e => {
		e.preventDefault();
		tags_field.save();
	});
	controls.discard.addEventListener('click', e => {
		tags_field.discard();
	});
	controls.copy.addEventListener('click', e => {
		let tag_string = tags_field.to_string(tags_field.tags_list).replace(' #', '#');
		autocopy(tag_string, plain_tags_editor.dataset.autocopyAlert, plain_tags_editor.dataset.copyAlert);
		tags_field.input.focus();
	});
	// fetch suggestions
	tags_field.fetch_suggestions();
}
// add listener for leaving page to check if any tags are still processing
window.addEventListener('beforeunload', e => {
	if (document.querySelector('.editing_tags')) {
		(e || window.event).returnValue = true;
		return true;
	}
});
