import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { KendoUIModules } from '@layout/index';
import { ImportRatecardDialogComponent } from './import-ratecard-dialog.component';

describe('ImportRatecardDialogComponent', () => {
	let component: ImportRatecardDialogComponent;
	let fixture: ComponentFixture<ImportRatecardDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ImportRatecardDialogComponent],
			imports: [KendoUIModules, FormsModule],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ImportRatecardDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
