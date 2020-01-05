module.exports = ["/api/state", (req, res) => {
	if( ! req.session.signed_in )
		return res.json({signed_in: false});

	// TODO UPDATE ADMIN AND CAMPAIGNING WITH REAL VALUES
	return res.json({
		signed_in: true,
		user: {
			email: req.session.email,
			name: req.session.name
		},
		admin: {
			is_admin: true,
			admin_privileges: "*"
		},
		campaign: {
			is_manager: true,
			manager_for: ["1"]
		}
	});
}];
