import { AfterContentChecked, Component, ElementRef, Input, OnChanges, QueryList, ViewChildren } from '@angular/core';
import { ColumnSortSettings } from '@progress/kendo-angular-grid';

import * as _ from 'lodash';

const PURCHASE_OPTIONS_TITLE = 'PURCHASE OPTION';
const ADDITIONAL_POINTS_TITLE = 'ADDITIONAL POINTS';

@Component({
	selector: 'app-grid-ratecardinputs-readonly',
	templateUrl: './grid-ratecardinputs-readonly.component.html',
	styleUrls: ['./grid-ratecardinputs-readonly.component.scss'],
})
export class GridRatecardinputsReadonlyComponent implements OnChanges, AfterContentChecked {
	/**
	 * @property {ColumnSortSettings[]} rows receives columns data for display in grid
	 */
	@Input('columns') columns: ColumnSortSettings[] | any[];
	/**
	 * @property {object[]} rows receives rows data for display in grid
	 */
	@Input('rows') rows: object[];

	/**
	 * @property {Boolean} isLocked receives isLocked data for display in grid
	 */
	@Input('isLocked') isLocked: boolean = false;

	/**
	 * @property {Boolean} isLocked receives isRateFactors value for render in grid
	 */
	@Input('isRateFactors') isRateFactors: boolean = false;

	/**
	 * @property {QueryList<ElementRef>} scroll stores the dom element of the scrollbar
	 */
	@ViewChildren('scroll')
	private scroll: QueryList<ElementRef>;

	/**
	 * @property {QueryList<ElementRef>} grid stores the dom element of the grid
	 */
	@ViewChildren('grid')
	private grid: QueryList<ElementRef>;

	/**
	 * @property {Number} pageSize Stores number of rows to display in the grid page. This helps to resize the grid based on rows number.
	 */
	public pageSize: number;

	/**
	 * @property {String[]} scrollWidth Stores the scroll size in pixels.
	 */
	public scrollWidth = [];

	/**
	 * @property {string} purchaseOptionsTitle It stores the value of the PURCHASE_OPTIONS_TITLE constant for using
	 * in html component file.
	 */

	public purchaseOptionsTitle = PURCHASE_OPTIONS_TITLE;

	/**
	 * @property {string} additionalPointsTitle  It stores the value of the PURCHASE_OPTIONS_TITLE constant for using
	 * in html component file.
	 */
	public additionalPointsTitle = ADDITIONAL_POINTS_TITLE;

	constructor() {
		const scrollWith = this.isRateFactors ? '360px' : '551px';
		this.scrollWidth = [scrollWith, scrollWith];
	}

	/**
	 * @method ngOnChanges
	 * Respond when change value from inputs columns and rows
	 * @param changes receives values changes from columns and rows
	 * @return {void}
	 */
	public ngOnChanges(changes): void {
		this.columns = changes.columns.currentValue;
		this.rows = changes.rows.currentValue;
		this.isLocked = changes.isLocked ? changes.isLocked.currentValue : this.columns[0].locked;
		this.pageSize = this.rows ? this.rows.length : 0;
	}

	/**
	 * @method ngAfterContentChecked
	 * Respond the dom rendering is complete and checks the values
	 * @return {void}
	 */
	public ngAfterContentChecked() {
		if (!this.grid) {
			return;
		}

		const grids = this.grid.toArray();
		const scrolls = this.scroll.toArray();
		// Validate if scrolls exists on grid based on terms columns length and then apply the scroll functionality.
		if (scrolls && scrolls.length > 0) {
			_.each(grids || [], (_grid, _index) => {
				const tempGrid: ElementRef | any = _grid;
				const scrollableGrid: ElementRef | any = tempGrid.wrapper.nativeElement.children[0].children[1].children[1];
				const scrollerElement: ElementRef | any = scrolls[_index].nativeElement;
				const clientWidth = scrollableGrid?.children?.[0]?.children?.[0]?.clientWidth;
				const width = this.isRateFactors ? clientWidth + 100 : clientWidth;
				this.scrollWidth[_index] = width + 'px';
				scrollerElement.onscroll = (_event) => {
					const scrollPosition = _event.srcElement.scrollLeft;
					scrollableGrid.scrollTo(scrollPosition, 0);
				};
				scrollableGrid.onscroll = (_event) => {
					const scrollPosition = _event.srcElement.scrollLeft;
					scrollerElement.scrollTo(scrollPosition, 0);
				};
			});
		}
	}

	/**
	 * @method displayRFTermHeader
	 * Displays RateFactors Terms header template.
	 * @return {void}
	 */
	public displayRFTermHeader(_column) {
		return _column.field.includes('term');
	}
}
