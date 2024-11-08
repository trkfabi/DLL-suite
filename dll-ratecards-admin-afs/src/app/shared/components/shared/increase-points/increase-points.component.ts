import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';

@Component({
	selector: 'app-increase-points',
	templateUrl: './increase-points.component.html',
	styleUrls: ['./increase-points.component.scss'],
})
export class IncreasePointsComponent implements OnInit, OnChanges {
	/**
	 * @property {number} pointsData receives points data for manipulate with buttons increase and decrease
	 */
	@Input('pointsData') pointsData: number;
	/**
	 * @property {number} minValue receives min value for validate
	 */
	@Input('minValue') minValue: number = 0;
	/**
	 * @property {number} maxValue receives max value for validate
	 */
	@Input('maxValue') maxValue: number = 4;
	/**
	 * @property {string} textInput receives text for display in input text
	 */
	@Input('textInput') text: string = 'Up to';
	/**
	 * @property {EventEmitter} pointsDataOutput return value from total to output
	 */
	@Output() pointsDataOutput: EventEmitter<number> = new EventEmitter();
	/**
	 * @property {number} total total data to display
	 */
	public total: number = 0;
	/**
	 * @property {string} inputValue input valut to display in input text
	 */
	public inputValue: string;
	/**
	 * @property {string} decreasePoints text for decrease total value
	 */
	public decreasePoints: string = 'decrease';
	/**
	 * @property {string} increasePoints text for increase total value
	 */
	public increasePoints: string = 'increase';
	/**
	 * @method ngOnInit
	 * Respond when initialize app
	 * @return {void}
	 */
	public ngOnInit(): void {
		this.total = this.pointsData || 0;
		this.inputValue = `${this.text} ${this.total}`;
	}
	/**
	 * @method ngOnChanges
	 * Respond when change value from input pointsData
	 * @param _changes receives changes in input pointsData
	 */
	public ngOnChanges(_changes): void {
		this.total = _changes.pointsData.currentValue;
		this.inputValue = `${this.text} ${this.total}`;
	}
	/**
	 * @method onOperationAction
	 * Update current value total increase or decrease depend on action type and return with Output the current total value
	 * @param {string} _type Input type action increase or decrease
	 * @return {void}
	 */
	public onOperationAction(_type: string): void {
		if (_type === 'increase' && this.total < this.maxValue) {
			++this.total;
		}
		if (_type === 'decrease' && this.total > this.minValue) {
			--this.total;
		}

		this.inputValue = `${this.text} ${this.total}`;
		this.returnTotal();
	}
	/**
	 * @method returnTotal
	 * Return total value to output from component
	 * @return {void}
	 */
	public returnTotal(): void {
		this.pointsDataOutput.emit(this.total);
	}
}
