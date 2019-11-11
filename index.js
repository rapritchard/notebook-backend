require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const Note = require('./models/note');
app.use(express.static('build'));
app.use(bodyParser.json());
app.use(cors());


const requestLogger = (req, res, next) => {
	console.log('Method:', req.method);
	console.log('Path:  ', req.path);
	console.log('Body:  ', req.body);
	console.log('---');
	next();
};

app.use(requestLogger);

app.get('/', (req, res) => {
	res.send('<h1>Hello World!</h1>');
});

app.get('/api/notes', (req, res) => {
	Note.find({}).then(notes => {
		res.json(notes.map(note => note.toJSON()));
	});
});

app.get('/api/notes/:id', (req, res, next) => {
	Note.findById(req.params.id)
		.then(note => {
			if(note) {
				res.json(note.toJSON());
			} else {
				res.status(404).end();
			}
		})
		.catch(error => next(error));
});

app.post('/api/notes', (req, res, next) => {
	const body = req.body;

	if(!body.content) {
		return res.status(400).json({ error: 'content missing' });
	}

	const note = new Note({
		content: body.content,
		important: body.important || false,
		date: new Date(),
	});

	note
		.save()
		.then(savedNote => savedNote.toJSON())
		.then(savedAndFormattedNote => {
			res.json(savedAndFormattedNote);
		})
		.catch(error => next(error));

});

app.put('/api/notes/:id', (req, res, next) => {
	const body = req.body;

	const note = {
		content: body.content,
		important: body.important,
	};

	Note.findByIdAndUpdate(req.params.id, note, { new: true })
		.then(updatedNote => {
			res.json(updatedNote.toJSON());
		})
		.catch(error => next(error));
});

app.delete('/api/notes/:id', (req, res, next) => {
	Note.findByIdAndRemove(req.params.id)
		.then(result => {
			res.status(204).end();
		})
		.catch(error => next(error));
});

const unknownEndpoint = (req, res) => {
	res.status(404).send({
		error: 'unknown endpoint'
	});
};
// handler of requests with unknown endpoint
app.use(unknownEndpoint);

const errorHandler = (error, req, res, next) => {
	console.error(error.message);

	if (error.name === 'CastError' && error.kind === 'ObjectId') {
		return res.status(400).send({ error: 'malformatted id' });
	} else if (error.name === 'ValidationError') {
		return res.status(400).json({ error: error.message });
	}

	next(error);
};
// handler of requests with result to errors
app.use(errorHandler);

const PORT = `${process.env.PORT}` || 3001;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
