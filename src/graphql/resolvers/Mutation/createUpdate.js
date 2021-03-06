const mongoose = require('mongoose');
const getLinkPreview = require('../../../utils/getLinkPreview');
const uploadPicStream = require('../../../utils/uploadPicStream');
const { CLOUDINARY_PREFIX } = require('../../../constants');
const Update = mongoose.model('Update');
const Candidate = mongoose.model('Candidate');
const Election = mongoose.model('Election');
const { UserInputError, ApolloError } = require('apollo-server-express');
const shortid = require('shortid');

module.exports = async (
	root,
	{
		title,
		content,
		link,
		pictures,
		electionId,
		candidateId,
		official,
		pinned
	},
	{ authenticationRequired, candidateManagerRequired, adminRoleRequired }
) => {
	authenticationRequired();

	if (!title) {
		throw new UserInputError('The title field cannot be left empty', {
			invalidArgs: ['title']
		});
	}

	if (!content) {
		throw new UserInputError('The content field cannot be left empty.', {
			invalidArgs: ['content']
		});
	}

	let candidate;
	let election;
	if (official) {
		await adminRoleRequired('updates');
		election = await Election.findById(electionId);
		if (!election) {
			throw new ApolloError(
				'There is no election with that ID',
				'ID_NOT_FOUND'
			);
		}
	} else {
		await candidateManagerRequired(candidateId);
		candidate = await Candidate.idLoader.load(candidateId);
	}

	let linkPreview;
	const uploadedPics = [];

	if (pictures?.length) {
		pictures = await pictures;

		for (let i = 0; i < pictures.length; i++) {
			const pic = await pictures[i];
			if (!pic.mimetype || !pic.mimetype.startsWith('image/')) {
				throw new UserInputError(
					'Only image files can be uploaded as the picture.',
					{
						invalidArgs: ['pictures']
					}
				);
			}

			const file = await uploadPicStream(
				pic,
				`${CLOUDINARY_PREFIX}/${candidate.electionId}/${
					candidate.id
				}/${shortid.generate()}`
			);

			uploadedPics.push({
				publicId: file.public_id,
				width: file.width,
				height: file.height,
				mimetype: pic.mimetype
			});
		}
	}

	// Check to see if we can add a link preview to the request
	if (link) {
		const preview = await getLinkPreview(link);
		// These two fields are mandatory and we won't accept link previews that don't have them
		if (preview.title && preview.image) {
			linkPreview = preview;
		}
	}

	return await Update.create({
		electionId: official ? electionId : candidate.electionId,
		candidateId: candidate ? candidate._id : null,
		showOnHome: true,
		pinned: official ? pinned : false,
		title,
		content,
		official,
		link: linkPreview,
		pictures: uploadedPics,
		// Status is either 'approved', 'rejected', or 'pending'
		approval: {
			status: official ? 'approved' : 'pending'
		},
		createdAt: new Date()
	});
};
