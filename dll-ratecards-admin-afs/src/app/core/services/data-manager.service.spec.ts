import { inject, TestBed } from '@angular/core/testing';

import { DataManagerService } from './data-manager.service';

xdescribe('DataManagerService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [DataManagerService],
		});
	});

	it('should be created', inject([DataManagerService], (service: DataManagerService) => {
		expect(service).toBeTruthy();
	}));
});
