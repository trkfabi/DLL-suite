import { Injectable, OnInit } from '@angular/core';

/**
 * @class NumberHelper
 * Parse values to display as Percentage or Retrieve the Integrer number.
 */
@Injectable()
export class NumberHelper {
	constructor() {
		// nothing to do
	}

	/**
	 * @method formatResidual
	 * Format the value for the terms in the residual section
	 * NOTE: Formatting of Residuals section is different from that of COF and Spreads
	 * If user enters a value of 36, it should be retained as 36% instead of 36.00%
	 * If user enters say 46.5 it should be 46.5% instead of making it 46.50%
	 * @param {Number} _value Number to format
	 * @param {Number} _decimals Number of decimals wanted
	 * @return {String}
	 */
	public formatResidual(_value: number = 0, _decimals: number = 4) {
		const newValue = this.truncateNumber(_value * 100, _decimals);
		return `${newValue}%`;
	}

	/**
	 * @method formatPercentage
	 * Format the value as percentage string
	 * @param {Number} _value Number to format as percentage.
	 * @param {Number} _decimals Number of decimals wanted.
	 * @param {String} _gridType flag to distinguish non rate-factors figures.
	 * @return {String}
	 */
	public formatPercentage(_value: number = 0, _decimals: number = 4, _gridType: string = '') {
		// We truncate to 4 decimal due to the number should be converted to
		// a percent format with 2 decimals
		const newValue = Number(this.truncateNumber(_value, _decimals));

		// After truncate, multiply by 100 to get its percent format
		// IMPORTANT: After get the percent format we need to fixed to 2 decimals
		// because the multiplication in sometimes alter the fixed point values at the
		// last decimal digits. So, this will help to get our two original decimals always
		// In example:
		// _value -> .1357
		// this.truncate(_value,4) -> .1357
		// (newValue * 100) -> 13.569999999999 (We loss the data due to fixed point calculations)
		// (newValue * 100).toFixed(2) -> 13.57 (toFixed help us to restore the lost data)
		let newValueString;

		if (_gridType === 'RC' || _gridType === 'RCC') {
			newValueString = newValue.toFixed(_decimals);
		} else if (_gridType === 'RSD') {
			newValueString = newValue.toFixed();
		} else {
			newValueString = (newValue * 100).toFixed(2);
		}

		return _gridType === 'RC' || _gridType === 'RCC' ? `${newValueString}` : `${newValueString}%`;
	}

	/**
	 * @method parsePercentage
	 * Parse a percentage value to Number
	 * @param {String} _value Value to parse and convert to number.
	 * @return {Number}
	 */
	public parsePercentage(_value: string = ''): number {
		let value: number;
		value = Number(_value.replace(/[^\d\.]/g, '')) / 100;
		value = Number('' + value.toFixed(5)) || 0;
		return value;
	}

	/**
	 * @method parseToDecimals
	 * Parse to decimals an integrer value
	 * @return {Number}
	 */
	public parseToDecimals(_value: number) {
		return _value / 100;
	}

	/**
	 * @method moveDecimalPoint
	 * Moves decimal point two places to the left
	 * @param  {String} _value the string value representation of a float number
	 * @param  {String} _decimals Number of decimals wanted
	 * @return {String}
	 */
	public moveDecimalPoint(_value: string, _decimals: number = 4) {
		const numValue = Number(_value);
		if (numValue > 100) {
			return '1';
		}
		return (Number(_value) / 100).toFixed(_decimals);
	}

	/**
	 * @method currenctyFormat
	 * Add currency sign before value.
	 * @param  {Number|String} _value the grid value to process
	 * @param  {Boolean} _isItad flag to show if the _value is an iTad value
	 * @return {String}
	 */

	public currenctyFormat(_value, _isItad = false) {
		if (_isItad) {
			if (_value[0] === '$') {
				_value = _value.substring(1);
			}
			return `\$${parseFloat(_value).toFixed(2)}`;
		} else {
			return `\$${this.truncateNumber(parseFloat(_value), 2)}`;
		}
	}

	/**
	 * @method parseToNumber
	 * Parses any value to number, returning 0 if invalid.
	 * Does not support negative values.
	 * @param {String} _value value to apply format
	 * @return {Number}
	 */
	public parseToNumber(_value: string): number {
		return Number(_value.replace(/[^\d\.\-]/g, '')) || 0;
	}

	/**
	 * @method truncateNumber
	 * Method that helps to truncate a number with specified decimal digits.
	 * @param {Number} _value value to apply format
	 * @param {Number} _decimals number of decimals to use
	 * @return {Number}
	 */
	private truncateNumber(_value: number, _decimals: number): string {
		let stringValue = this.toFixed(_value, _decimals);
		const integerPartLength = stringValue.indexOf('.') + 1;
		stringValue = stringValue.substr(0, integerPartLength + _decimals);
		return _value === 0 ? '0' : stringValue;
	}

	/**
	 * @method toFixed
	 * Method that helps to round up a number with better precision.
	 * @param {Number} _number value to apply format
	 * @param {Number} _precision number of decimals to use
	 * @return {Number}
	 */
	private toFixed(_number: number, _precision: number) {
		return (+(Math.round(+(_number + 'e' + _precision)) + 'e' + -_precision)).toFixed(_precision);
	}
	/**
	 * @method formatNumber
	 * Format number to thounsand with comas and two decimals
	 * @param {number} _value number to format
	 * @return {string}
	 */
	public formatNumber(_value: number): string {
		const num = this.toFixed(_value, 2);
		return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
	}

	/**
	 * @method formatToFixed
	 * Method that helps to round up a number with decimals with better precision.
	 * @param {Number} _value value to apply format
	 * @param {Number} _decimals number of decimals to use
	 * @return {Number}
	 */
	public formatToFixed(_value: number, _decimals: number): string {
		return this.truncateNumber(_value, _decimals);
	}
}
