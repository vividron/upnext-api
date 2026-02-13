import express from "express";

const router = express.Router();

router.post('/create-room', (req, res)=> true);
router.get('/:code', (req, res)=> true);
router.delete('/delete-room', (req, res)=> true);