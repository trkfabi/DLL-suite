import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

import { doLog } from '../app-settings';
import { AuthService } from '../services';

const LOG_TAG = '[core/guards/LoginGuardService]';

/**
 * @class LoginGuardService
 * Prevent access to login while in an active session.
 * @uses angular.core.Injectable
 * @uses angular.route.CanActivate
 * @uses core.services.AuthService
 * @version 1.0.0
 */
@Injectable()
export class LoginGuardService implements CanActivate {
	constructor(private _auth: AuthService, private router: Router) {}

	/**
	 * @method canActivate
	 * Validate if the user can access the /login route.
	 * @return {Boolean}
	 */
	public canActivate(next?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) {
		doLog && console.log(LOG_TAG, '- canActivate');
		if (this._auth.isSessionActive()) {
			const permission = this._auth.getUserPermissions();
			const validPath = `/${permission}/dashboard`;
			this.router.navigate([validPath]);
			return false;
		}
		return true;
	}
}
