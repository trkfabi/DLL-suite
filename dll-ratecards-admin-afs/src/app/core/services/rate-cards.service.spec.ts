import { inject, TestBed } from '@angular/core/testing';

import { RateCardsService } from './rate-cards.service';

describe('RateCardsService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [RateCardsService],
		});
	});

	it('should be created', inject([RateCardsService], (service: RateCardsService) => {
		expect(service).toBeTruthy();
	}));
});
