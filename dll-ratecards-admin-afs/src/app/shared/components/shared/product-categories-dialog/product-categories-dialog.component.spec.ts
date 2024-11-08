import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { KendoUIModules } from '@layout/index';
import { ProductCategoriesDialogComponent } from './product-categories-dialog.component';

xdescribe('ProductCategoriesDialogComponent', () => {
	let component: ProductCategoriesDialogComponent;
	let fixture: ComponentFixture<ProductCategoriesDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [FormsModule, ReactiveFormsModule, KendoUIModules],
			declarations: [ProductCategoriesDialogComponent],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ProductCategoriesDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
