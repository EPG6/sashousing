import { Request, Response, NextFunction } from 'express';
import { HousingReviews } from '../models/Housing';

export const isAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.session.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    if (!req.session.user.isAdmin) {
        res.status(403).json({ message: 'Admin access required' });
        return;
    }

    next();
};

export const isHousingReviewOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.session.user?.id) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    const review = await HousingReviews.findOne({
        id: Number(req.params.reviewId),
    });

    if (!review) {
        res.status(404).json({ message: 'Review not found' });
        return;
    }

    if (review.user_id !== req.session.user.id) {
        res.status(403).json({
            message: 'You are not authorized to modify this review',
        });
        return;
    }

    next();
};
