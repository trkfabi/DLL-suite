/**
 * @class AppModulePath
 * @abstract
 * Display URLs list from files afs.json, othc.json and shared.json.
 * Urls `Interface`
 * @version 1.0.0
 */
export interface AppModulePath {
	batch_update_models?: string;
	create_category?: string;
	delete_category?: string;
	update_category?: string;
	create_product?: string;
	update_product?: string;
	delete_product?: string;
	update_rate_card_input?: string;
	fetch_rate_programs?: string;
	update_rate_program?: string;
	reorder_rate_programs?: string;
	delete_rate_program?: string;
	duplicate_rate_program?: string;
	create_rate_program?: string;
	update_cof?: string;
	update_spread?: string;
	update_residual?: string;
	update_terms?: string;
	fetch_rate_cards: string;
	rate_cards_vendor_code: string;
	export_audit_log: string;
	fetch_import_list: string;
	import_rate_card: string;
	fetch_rate_card: string;
	delete_rate_card: string;
	create_rate_card: string;
	fetch_version: string;
	fetch_rate_factors: string;
	rcm_authenticate: string;
	compare_rate_cards: string;
	export_version: string;
	publish_rate_card: string;
	update_rate_card: string;
	create_version: string;
	delete_version: string;
	update_version: string;
	recalculate_version: string;
	duplicate_version: string;
	delete_vendor_code: string;
	create_vendor_code: string;
	update_vendor_code: string;
}
