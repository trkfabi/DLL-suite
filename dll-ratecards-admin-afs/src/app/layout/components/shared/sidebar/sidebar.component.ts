import { Component, ViewChild } from '@angular/core';

/**
 * @class SidebarComponent
 * The Sidebar component with sidenavigation.
 * @uses angular.core.ViewChild
 * @version 1.0.0
 */
@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
	/**
	 * @property {Object} sidenav
	 * Find the `sidenav` child component.
	 * `Note:` variable is not typed as contains the SideNav object from DOM.
	 */
	@ViewChild('sidenav') public sidenav;

	/**
	 * @method sidenavToggle
	 * Toggle display for sidenav component.
	 * @return {void}
	 */
	public sidenavToggle() {
		this.sidenav.toggle();
	}
}
