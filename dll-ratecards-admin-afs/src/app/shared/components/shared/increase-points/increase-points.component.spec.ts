import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SetupUnitTests } from '@shared/utils';
import { IncreasePointsComponent } from './increase-points.component';

const setupUnitTests = new SetupUnitTests();

describe('IncreasePointsComponent', () => {
	let component: IncreasePointsComponent;
	let fixture: ComponentFixture<IncreasePointsComponent>;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [IncreasePointsComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(IncreasePointsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#returnTotal', () => {
		it('should exist function returnTotal', () => {
			const func = spyOn(component, 'returnTotal');
			component.returnTotal();

			expect(func).toHaveBeenCalled();
		});

		it('should function returnTotal and recive array in emit event', () => {
			spyOn(component.pointsDataOutput, 'emit').and.callThrough();
			component.total = 3;
			component.returnTotal();
			fixture.detectChanges();
			const actual: any = (component.pointsDataOutput.emit as any).calls.mostRecent().args[0];
			const expected = 3;

			expect(expected).toEqual(actual);
		});
	});
});
