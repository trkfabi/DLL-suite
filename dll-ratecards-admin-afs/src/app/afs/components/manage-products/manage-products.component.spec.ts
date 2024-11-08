import { HttpBackend, HttpClient, HttpHandler } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppSettings } from '@core/index';
import { AuthService, BusyService, ErrorService, LayoutService, ToastEventHandlerService, ToastService, WebServices } from '@core/services';
import { DataManagerService } from '@core/services/data-manager.service';
import { RateCardsService } from '@core/services/rate-cards.service';
import { RateCardsWebService } from '@core/services/ratecards.webservice';
import { KendoUIModules } from '@layout/index';
import { NumberHelper } from '@lib/index';
import { DialogContainerService, DialogService } from '@progress/kendo-angular-dialog';
import { SetupUnitTests, ToastServiceMock } from '@shared/utils';
import { ToasterService } from 'angular2-toaster';
import { ManageProductsComponent } from './manage-products.component';

const setupUnitTests = new SetupUnitTests();

describe('[afs/components/manage-products/ManageProductsComponent]', () => {
	let component: ManageProductsComponent;
	let fixture: ComponentFixture<ManageProductsComponent>;
	let busyService: BusyService;

	beforeEach(async(() => {
		setupUnitTests.loginUser();
		TestBed.configureTestingModule({
			declarations: [ManageProductsComponent],
			imports: [RouterTestingModule, KendoUIModules],
			providers: [
				AppSettings,
				AuthService,
				BusyService,
				WebServices,
				HttpClient,
				HttpHandler,
				DialogService,
				DialogContainerService,
				ErrorService,
				{ provide: ToastService, useFactory: () => ToastServiceMock.instance() },
				ToasterService,
				ToastEventHandlerService,
				RateCardsWebService,
				DataManagerService,
				RateCardsService,
				LayoutService,
				NumberHelper,
				HttpBackend,
			],
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ManageProductsComponent);
		component = fixture.componentInstance;
		busyService = TestBed.inject(BusyService);
		fixture.detectChanges();
	});

	afterAll(() => setupUnitTests.logout());

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('#loadVersionSelected', () => {
		it('should exist function loadVersionSelected', () => {
			const func = spyOn(component, 'loadVersionSelected');
			component.loadVersionSelected();

			expect(func).toHaveBeenCalled();
		});

		it('should function loadVersionSelected add empty arrays variables productCategories and products', () => {
			component.loadVersionSelected();
			const expectedCategory = component.productCategories;
			const expectedProduct = component.products;
			const actual = [];

			expect(expectedCategory).toEqual(actual);
			expect(expectedProduct).toEqual(actual);
		});

		it('should function loadVersionSelected input value same to versionSelected', () => {
			const value = { products: {}, categories: {} };
			component.loadVersionSelected(value);
			const expected = component.versionSelected;

			expect(expected).toEqual(value);
		});
	});

	describe('#validateProductCategories', () => {
		it('should exist function validateProductCategories', () => {
			const func = spyOn(component, 'validateProductCategories');
			component.validateProductCategories();

			expect(func).toHaveBeenCalled();
		});

		it('should function validateProductCategories input value array with orders properties and return values ordered', () => {
			const value = [{ order: 5 }, { order: 3 }, { order: 1 }, { order: 4 }];
			const actual = [{ order: 1 }, { order: 3 }, { order: 4 }, { order: 5 }];
			component.productCategories = value;
			component.validateProductCategories();
			const expected = component.productCategories;

			expect(expected).toEqual(actual);
		});

		it('should function validateProductCategories return empty array', () => {
			component.productCategories = null;
			const actual = [];
			component.validateProductCategories();
			const expected = component.productCategories;

			expect(expected).toEqual(actual);
		});
	});

	describe('#filterProducts', () => {
		it('should exist function filterProducts', () => {
			const func = spyOn(component, 'filterProducts');
			const id = 1;
			component.filterProducts(id);

			expect(func).toHaveBeenCalled();
		});

		it('should function filterProducts input category id and return products filters', () => {
			const id = 1;
			const values = [
				{ categoryId: 1, order: 5, name: 'a' },
				{ categoryId: 1, order: 2, name: 'b' },
				{ categoryId: 1, order: 7, name: 'c' },
			];
			component.products = values;
			component.filterProducts(id);
			const expectedFiltered = component.productsFiltered.length;
			const actualProducts = component.products.length;

			expect(expectedFiltered).toBe(actualProducts);
		});

		it('should function filterProducts input wrong category id and return zero results', () => {
			const id = 5;
			const values = [
				{ categoryId: 1, order: 5, name: 'a' },
				{ categoryId: 1, order: 2, name: 'b' },
				{ categoryId: 1, order: 7, name: 'c' },
			];
			const actual = 0;
			component.products = values;
			component.filterProducts(id);
			const expected = component.productsFiltered.length;

			expect(expected).toBe(actual);
		});
	});

	describe('#reSortIndexes', () => {
		it('should exist function reSortIndexes', () => {
			const func = spyOn(component, 'reSortIndexes');
			const type = 'product';
			component.reSortIndexes(type);

			expect(func).toHaveBeenCalled();
		});

		it('should function reSortIndexes input value "product"', () => {
			const values = [{ order: 0 }, { order: 1 }, { order: 2 }];
			const type = 'product';
			const actual = [{ order: 1 }, { order: 2 }, { order: 3 }];
			component.productsFiltered = values;
			component.reSortIndexes(type);
			const expected = component.productsFiltered;

			expect(expected).toEqual(actual);
		});

		it('should function reSortIndexes input value "productCategory"', () => {
			const values = [{ order: 0 }, { order: 1 }, { order: 2 }];
			const type = 'productCategory';
			const actual = [{ order: 1 }, { order: 2 }, { order: 3 }];
			component.productCategories = values;
			component.reSortIndexes(type);
			const expected = component.productCategories;

			expect(expected).toEqual(actual);
		});
	});

	describe('#addNewItem', () => {
		it('should exist function addNewItem', () => {
			const func = spyOn(component, 'addNewItem');
			const type = 'productCategory';
			const value = { versionId: 1, name: 'name', order: 'asc' };
			component.addNewItem(type, value);

			expect(func).toHaveBeenCalled();
		});

		it('should function addNewItem and call method "createCategory"', () => {
			const spyCreate = spyOn(component._dataManagerService, 'createCategory');
			const type = 'productCategory';
			const value = { versionId: 1, name: 'name', order: 'asc' };
			const valuesVersion = { categories: [], products: [] };
			component.versionSelected = valuesVersion;
			component.addNewItem(type, value);

			expect(spyCreate).toHaveBeenCalled();
		});

		it('should function addNewItem and call method "createProduct"', () => {
			const spyCreate = spyOn(component._dataManagerService, 'createProduct');
			const valuesVersion = { categories: [], products: [] };
			const type = 'product';
			const value = { versionId: 1, name: 'name', order: 'asc' };
			component.versionSelected = valuesVersion;
			component.addNewItem(type, value);

			expect(spyCreate).toHaveBeenCalled();
		});
	});

	describe('#editItem', () => {
		it('should exist function editItem', () => {
			const func = spyOn(component, 'editItem');
			const type = 'productCategory';
			const valuesVersion = { categories: [], products: [] };
			const value = { versionId: 1, name: 'name', order: 'asc' };
			component.versionSelected = valuesVersion;
			component.editItem(type, value);

			expect(func).toHaveBeenCalled();
		});

		it('should function editItem and call method "updateProduct"', () => {
			const spyEdit = spyOn(component._dataManagerService, 'updateProduct');
			const valuesVersion = { categories: [], products: [] };
			const valueProducts = [{ id: 1, name: 'b' }];
			const value = { id: 1, versionId: 1, name: 'name', order: 'asc' };
			const type = 'product';
			component.products = valueProducts;
			component.versionSelected = valuesVersion;
			component.editItem(type, value);

			expect(spyEdit).toHaveBeenCalled();
		});

		it('should function editItem and call method "updateCategory"', () => {
			const spyEdit = spyOn(component._dataManagerService, 'updateCategory');
			const type = 'productCategory';
			const value = { id: 1, versionId: 1, name: 'name', order: 'asc' };
			const valuesVersion = { categories: [], products: [] };
			const categories = [{ id: 1, name: 'a' }];
			component.productCategories = categories;
			component.versionSelected = valuesVersion;
			component.editItem(type, value);

			expect(spyEdit).toHaveBeenCalled();
		});
	});

	describe('#removeItem', () => {
		it('should exist function removeItem', () => {
			const func = spyOn(component, 'removeItem');
			const type = 'product';
			const value = { id: 1 };
			component.removeItem(type, value);

			expect(func).toHaveBeenCalled();
		});

		it('should function removeItem and call method "removeProduct"', () => {
			const spyDelete = spyOn(component._dataManagerService, 'removeProduct');
			const type = 'product';
			const value = { id: 1 };
			const valueFiltered = [{ id: 1 }];
			const valuesVersion = { categories: [], products: [] };
			component.productsFiltered = valueFiltered;
			component.versionSelected = valuesVersion;
			component.removeItem(type, value);

			expect(spyDelete).toHaveBeenCalled();
		});

		it('should function removeItem and call method "removeCategory"', () => {
			const spyDelete = spyOn(component._dataManagerService, 'removeCategory');
			const type = 'productCategory';
			const valuesVersion = { categories: [], products: [] };
			const value = { id: 1 };
			const valueFiltered = [{ id: 1 }];
			component.productCategories = valueFiltered;
			component.versionSelected = valuesVersion;
			component.removeItem(type, value);

			expect(spyDelete).toHaveBeenCalled();
		});
	});

	describe('#validateResponseError', () => {
		it('should exist function validateResponseError', () => {
			const func = spyOn(component, 'validateResponseError');
			const response = { error: { message: 'hello' } };
			component.validateResponseError(response);

			expect(func).toHaveBeenCalled();
		});

		it('should function validateResponseError and call method "open"', () => {
			const spyOpen = spyOn(component._dialogService, 'open');
			const response = { error: { message: 'hello' } };
			component.validateResponseError(response);

			expect(spyOpen).toHaveBeenCalled();
		});
	});

	describe('#openProductCategoryDialog', () => {
		it('should exist function openProductCategoryDialog', () => {
			const func = spyOn(component, 'openProductCategoryDialog');
			const title = 'Edit Category';
			const value = {};
			component.openProductCategoryDialog(title, value, value);

			expect(func).toHaveBeenCalled();
		});

		it('should function openProductCategoryDialog assign values to dialogRefComponent', () => {
			const actualType = 'productCategory';
			const actualDelete = false;
			const actualEdit = true;
			const title = 'Edit Category';
			const value = {};
			component.openProductCategoryDialog(title, value, value);
			const expectedType = component.dialogRefComponent.type;
			const expectedDelete = component.dialogRefComponent.isDelete;
			const expectedEdit = component.dialogRefComponent.edit;

			expect(expectedType).toEqual(actualType);
			expect(expectedDelete).toEqual(actualDelete);
			expect(expectedEdit).toEqual(actualEdit);
		});
	});

	describe('#openProductDialog', () => {
		it('should exist function openProductDialog', () => {
			const func = spyOn(component, 'openProductDialog');
			const value = {};
			const title = 'title';
			component.openProductDialog(title, value, value);

			expect(func).toHaveBeenCalled();
		});

		it('should function openProductDialog assign values to dialogRefComponent', () => {
			const actualType = 'product';
			const actualDelete = false;
			const title = 'Title';
			const value = {};
			component.openProductDialog(title, value, value);
			const expectedType = component.dialogRefComponent.type;
			const expectedDelete = component.dialogRefComponent.isDelete;

			expect(expectedType).toEqual(actualType);
			expect(expectedDelete).toEqual(actualDelete);
		});
	});

	describe('#hideLoader', () => {
		it('should exist function hideLoader', () => {
			const func = spyOn(component, 'hideLoader');
			component.hideLoader();

			expect(func).toHaveBeenCalled();
		});

		it('should function hideLoader call function hideLoading in variable _busyService$', () => {
			const spyHide = spyOn(busyService, 'hideLoading');
			component.hideLoader();

			expect(spyHide).toHaveBeenCalled();
		});
	});

	describe('#showLoader', () => {
		it('should exist function showLoader', () => {
			const func = spyOn(component, 'showLoader');
			component.showLoader();

			expect(func).toHaveBeenCalled();
		});

		it('should function showLoader call function showLoading in variable _busyService$', () => {
			const spyHide = spyOn(busyService, 'showLoading');
			component.showLoader();

			expect(spyHide).toHaveBeenCalled();
		});
	});
});
