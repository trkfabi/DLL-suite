import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { KendoUIModules } from '@layout/index';
import { ReplaceDialogComponent } from './replace-dialog.component';

describe('ReplaceDialogComponent', () => {
	let component: ReplaceDialogComponent;
	let fixture: ComponentFixture<ReplaceDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ReplaceDialogComponent],
			imports: [KendoUIModules],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ReplaceDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
