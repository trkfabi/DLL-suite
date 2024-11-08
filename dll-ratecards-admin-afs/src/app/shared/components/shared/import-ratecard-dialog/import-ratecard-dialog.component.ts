import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
	selector: 'app-import-ratecard-dialog',
	templateUrl: './import-ratecard-dialog.component.html',
	styleUrls: ['./import-ratecard-dialog.component.scss'],
})
export class ImportRatecardDialogComponent implements OnInit {
	/**
	 * @property {Object[]} environmentList Receives the environments list to populate dropdown.
	 */
	@Input('environmentList') public environmentList;

	/**
	 * @property {Object} environment Receives the current environment.
	 */
	@Input('environment') public environment;

	/**
	 * @property {Object[]} ratecardsList Receives the ratecards list to populate dropdown.
	 */
	@Input('ratecardsList') public ratecardsList;

	/**
	 * @property {Object} rateCardSelected Receives the current rate card selected.
	 */
	@Input('rateCardSelected') public rateCardSelected;

	@Input('isReplace') public isReplace;

	@Input('importList') public importList;

	/**
	 * @property {Object} currentVersion Current ratecard version selected.
	 */
	public currentVersion;

	/**
	 * @property {Object} defaultVersionSelected Default ratecard version selected.
	 */
	public defaultVersionSelected;

	/**
	 * @property {Object[]} rateCardsVersionList the ratecards selected version list.
	 */
	public rateCardsVersionList;

	/**
	 * @property {String} selectedVersion Current version id selected in the dropdown list.
	 */
	public selectedVersion: string;

	/**
	 * @property {String} selectedEnvironment Current environment selected in the dropdown list.
	 */
	public selectedEnvironment: string;

	/**
	 * @property {String} selectedRateCard Current rate card id selected in the dropdown list.
	 */
	public rateCard;

	public ngOnInit() {
		if (this.importList) {
			this.environmentList = _.chain(this.importList)
				.flatMapDepth((item) => {
					return _.filter(item, (_item, _key) => {
						return _key === 'environment';
					});
				})
				.map((_env) => {
					return _.find(this.environmentList, { code: _env });
				})
				.value();

			this.environment = this.environmentList[0] || _.find(this.environmentList, { code: this.environment.code }) || null;

			this.ratecardsList = this.filterRateCards(this.environment) || null;
			this.rateCard = this.ratecardsList[0] || null;
			this.rateCardsVersionList = this.filterVersions(this.rateCard) || null;
			this.selectedVersion = this.rateCardsVersionList[0] || null;
		}
	}

	/**
	 * @method onEnvironmentSelectChange
	 * Filter the ratecards version on selector value change event.
	 * @param _evt the on change event from combo-box
	 * @return {void}
	 */
	public onEnvironmentSelectChange(_evt) {
		this.ratecardsList = this.filterRateCards(_evt);
		this.rateCard = null;
		this.selectedVersion = null;
		this.rateCardsVersionList = null;
	}

	/**
	 * @method onRateCardSelectChange
	 * Filter the ratecards version on selector value change event.
	 * @param _evt the on change event from combo-box
	 * @return {void}
	 */
	public onRateCardSelectChange(_evt) {
		this.rateCardsVersionList = this.filterVersions(_evt);
		this.selectedVersion = this.rateCardsVersionList[0] || null;
	}

	/**
	 * @method filterRateCards
	 * @private
	 * Filter the ratecards from import list based on environment selection.
	 * @param {Object} _env The environment selected to import data.
	 * @return {Object[]}
	 */
	private filterRateCards(_env) {
		if (this.importList && this.importList.length !== 0) {
			this.rateCardsVersionList = null;
			const rateCards =
				_.flatMapDepth(
					_.filter(this.importList, (_list) => {
						if (_list.environment === _env.code.toString()) {
							return _list;
						}
					}),
					(_item) => _item.rateCards
				) || null;
			const rateCardsLists = _.filter(rateCards, (_rateCard) => {
				return _rateCard.id !== this.rateCardSelected.id;
			});
			return _.sortBy(rateCardsLists, [(item) => item.name]);
		}
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
			return;
		}
		let versions = _.map(_ratecard.versions, (_version) => {
			const isPublished = (_version.published === true || _version.archived === true) && _version.datePublished;
			_version.versionDate = moment(isPublished ? _version.datePublished : _version.created_at).format('MM/DD/YYYY LT');
			return _version;
		});
		versions = _.orderBy(
			_.filter(versions, (_version) => new Date(_version.versionDate)),
			(_version) => new Date(_version.versionDate),
			['desc']
		);
		return versions;
	}
}
