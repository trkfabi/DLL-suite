import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
	selector: 'app-ratefactors-compare-dialog',
	templateUrl: './ratefactors-compare-dialog.component.html',
	styleUrls: ['./ratefactors-compare-dialog.component.scss'],
})
export class RatefactorsCompareDialogComponent implements OnInit {
	public versionName: string;
	/**
	 * @property {Object} environment Receives the current environment.
	 */
	@Input('environment') public environment;

	/**
	 * @property {Object} currentRateCard Receives the current rate card selected.
	 */
	@Input('currentRateCard') public currentRateCard;

	/**
	 * @property {Object[]} rateCardsVersionList the ratecards selected version list.
	 */
	public rateCardsVersionList;

	/**
	 * @property {Object} currentVersion Current ratecard version selected.
	 */
	public currentVersion;

	/**
	 * @property {Object} defaultVersionSelected Default ratecard version selected.
	 */
	public defaultVersionSelected;

	/**
	 * @property {number} versionsLength Has the length from versions in the current RateCard.
	 */
	public versionsLength: number;

	/**
	 * @property {number} sIndex Index number for the version selected to change the active color
	 */
	public sIndex: number = null;

	/**
	 * @property {String} versionSelectedId version Id from version selected
	 */
	public versionSelectedId: string = null;

	/**
	 * @property {string} versionCurrentId version current if to compare vs version selected
	 */
	public versionCurrentId: string = null;

	/**
	 * @property {string} versionSelectedName version name from version selected
	 */
	public versionSelectedName: string = null;

	/**
	 * @property {string} versionCurrentName version current name if to compare vs version selected
	 */
	public versionCurrentName: string = null;

	@Input('versionSelected') private versionSelected;

	constructor() {
		// nothing to do
	}

	public ngOnInit() {
		if (!this.currentRateCard.versions) {
			this.defaultVersionSelected = {
				versionDate: 'No versions',
				id: null,
			};
			return;
		}
		this.rateCardsVersionList = this.filterVersions(this.currentRateCard);
		this.versionsLength =
			this.currentRateCard.versions && this.currentRateCard.versions.length > 1 ? this.currentRateCard.versions.length : 0;
		this.versionCurrentId = this.versionSelected.id;
		this.versionName = this.findVersionName(this.versionSelected);
	}

	/**
	 * @method setIndex
	 * Set the index and item of the version selected for getting the compare and changes the color of the item active
	 * @param {number} _index the index number of the version selected.
	 * @param {Object} _item the version object selected
	 * @return {void}
	 */
	public setIndex(_index, _item) {
		this.sIndex = _index;
		this.versionSelectedId = _item.id;
		this.versionCurrentId = this.currentVersion.id;
		this.versionSelectedName = this.findVersionName(_item);
		this.versionCurrentName = this.versionName;
	}

	/**
	 * @method filterVersions
	 * Filter versions from ratecard selected
	 * @param {Object} _ratecard The ratecard selected from ratecardsList dropdown.
	 * @return {void}
	 */
	private filterVersions(_ratecard) {
		if (!_ratecard.versions) {
			this.defaultVersionSelected = {
				versionDate: 'No versions',
				id: null,
			};
			this.currentVersion = null;
			return;
		}
		_ratecard.versions = _.map(_ratecard.versions, (_version) => {
			const isPublished = (_version.published === true || _version.archived === true) && _version.datePublished;
			_version.versionDate = moment(isPublished ? _version.datePublished : _version.created_at);
			const versionName = this.findVersionName(_version);
			_.extend(_version, { versionName });
			return _version;
		});
		this.currentVersion = this.versionSelected;
		_.extend(this.currentVersion, { versionName: this.findVersionName(this.currentVersion) });
		_ratecard.versions = _.orderBy(
			_ratecard.versions,
			['canPublish', 'datePublished', 'published', 'archived'],
			['desc', 'desc', 'asc', 'asc']
		);
		return _ratecard.versions;
	}

	/**
	 * @method findVersionName
	 * Returns the version name to display.
	 * @return {String}
	 */
	private findVersionName(_version) {
		if (!_version) {
			return;
		}
		let versionName;
		if (_version && !_version.versionDate) {
			const isPublished = (_version.published === true || _version.archived === true) && _version.datePublished;
			_.extend(_version, { versionDate: moment(isPublished ? _version.datePublished : _version.created_at).format('MM/DD/YYYY') });
		}
		if (this.currentRateCard.versionInProgress === _version.id) {
			_version.versionDate = moment(_version.versionDate).format('MM/DD/YYYY');
			versionName = `${_version.versionDate} (In-Progress)`;
		} else if (this.currentRateCard.versionPublished === _version.id) {
			_version.versionDate = moment(_version.versionDate).format('MM/DD/YYYY LT');
			versionName = `${_version.versionDate} (Current)`;
		} else {
			_version.versionDate = moment(_version.versionDate).format('MM/DD/YYYY LT');
			versionName = `${_version.versionDate}`;
		}
		return versionName;
	}
}
