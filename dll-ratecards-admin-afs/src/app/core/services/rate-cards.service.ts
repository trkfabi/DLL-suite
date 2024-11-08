import * as _ from 'lodash';
import * as moment from 'moment';

import { Injectable } from '@angular/core';

@Injectable()
export class RateCardsService {
	public initRateCards(rateCards) {
		return _.map(rateCards, (rateCard, index) => {
			rateCard = this.initRateCard(rateCard);
			rateCard.selected = index === 0;

			return rateCard;
		});
	}

	public initRateCard(rateCard) {
		rateCard = _.defaults(rateCard, {
			name: null,
			versions: [],
			versionSelected: null,
		});

		const { versionInProgress, versionPublished, versions = [] } = rateCard;
		let { versionSelected } = rateCard;

		if (versions.length > 0) {
			rateCard.versions = this.initVersions(versions);

			if (!versionSelected) {
				versionSelected = versionPublished || versionInProgress || versions[0].id;
			}

			rateCard.versionSelected = this.expandVersion(rateCard, versionSelected);
			rateCard.versionInProgress = this.expandVersion(rateCard, versionInProgress);
			rateCard.versionPublished = this.expandVersion(rateCard, versionPublished);
		}

		return rateCard;
	}

	public initVersions(versions) {
		return _.map(versions, (version) => {
			return this.initVersion(version);
		});
	}

	public initVersion(version) {
		return _.defaults(version, {
			versionDate: moment(version.dateUpdated).format('DD/MM/YYYY'),
		});
	}

	public expandVersion(rateCard, versionId) {
		const { versions = [] } = rateCard;

		if (!versions || !versionId) {
			return null;
		}

		return _.find(versions, { id: versionId }) || null;
	}
}
