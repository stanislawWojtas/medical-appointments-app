export interface Review {
	_id: string;
	doctorId: string;
	patientId: {
		_id: string;
		firstName: string;
		lastName: string;
	} | string;
	appointmentId: string;
	rating: number;
	comment: string;
	createdAt: string;
}

export interface ReviewStats {
	averageRating: number;
	totalReviews: number;
	ratingDistribution: {
		1: number;
		2: number;
		3: number;
		4: number;
		5: number;
	};
}

export interface CreateReviewDto {
	appointmentId: string;
	rating: number;
	comment: string;
}
