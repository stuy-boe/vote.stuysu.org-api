const router = require('express').Router({ mergeParams: true });
const {
	elections,
	allowedGrades,
	candidates,
	votes
} = require('../../../../../database');

router.use(async (req, res, next) => {
	let election = await elections.findOne({
		where: {
			publicUrl: req.params.publicUrl
		},
		include: [
			{
				model: allowedGrades
			},
			{
				model: candidates
			}
		]
	});

	if (!election) {
		res.status(404).json({
			success: false,
			error: {
				code: 'NOT_FOUND',
				message: 'There is no election with that url'
			},
			payload: null
		});
	} else {
		req.election = election;

		next();
	}
});

router.get('/', async (req, res) => {
	req.election = req.election.toJSON();

	req.election.allowedGrades = req.election.allowedGrades.map(
		row => row.grade
	);

	req.election.numVotes = await votes.count({
		where: { electionId: req.election.id }
	});

	res.json({ success: true, payload: req.election });
});

router.use('/edit', require('./edit'));

module.exports = router;