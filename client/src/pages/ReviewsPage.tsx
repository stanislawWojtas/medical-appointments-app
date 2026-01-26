import { Box, Heading, Stack, Text, Flex, Card, Badge, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getReviewsByDoctor, getReviewStats } from "../services/consultationService";
import type { Review, ReviewStats } from "../models/Review";
import { useAuth } from "../context/AuthContext";

const ReviewsPage = () => {
	const { user } = useAuth();
	const doctorId = user?.doctorId || '';
	
	const [reviews, setReviews] = useState<Review[]>([]);
	const [stats, setStats] = useState<ReviewStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			await fetchReviews();
			await fetchStats();
		};
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [doctorId]);

	const fetchReviews = async () => {
		try {
			const reviews = await getReviewsByDoctor(doctorId);
			setReviews(reviews);
		} catch (error) {
			console.error("Error fetching reviews:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const stats = await getReviewStats(doctorId);
			setStats(stats);
		} catch (error) {
			console.error("Error fetching stats:", error);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const renderStars = (rating: number) => {
		return (
			<Flex gap={1}>
				{[1, 2, 3, 4, 5].map((star) => (
					<Text
						key={star}
						color={star <= rating ? "yellow.400" : "gray.300"}
						fontSize="lg"
					>
						★
					</Text>
				))}
			</Flex>
		);
	};

	if (isLoading) {
		return (
			<Box p={6} display="flex" justifyContent="center" alignItems="center" minH="400px">
				<Spinner size="xl" />
			</Box>
		);
	}

	return (
		<Box p={6}>
			<Heading mb={6}>Patient Reviews</Heading>

			{/* Statystyki */}
			{stats && stats.totalReviews > 0 && (
				<Card.Root mb={6} p={4} bg="blue.50">
					<Card.Body>
						<Flex gap={8} align="center">
							<Box>
								<Text fontSize="3xl" fontWeight="bold" color="blue.600">
									{stats.averageRating.toFixed(1)}
								</Text>
								<Text fontSize="sm" color="gray.600">Average Rating</Text>
								{renderStars(Math.round(stats.averageRating))}
							</Box>
							<Box>
								<Text fontSize="2xl" fontWeight="bold">
									{stats.totalReviews}
								</Text>
								<Text fontSize="sm" color="gray.600">Total Reviews</Text>
							</Box>
							<Box flex="1">
								<Text fontSize="sm" fontWeight="medium" mb={2}>Rating Distribution:</Text>
								{[5, 4, 3, 2, 1].map((rating) => (
									<Flex key={rating} align="center" gap={2} mb={1}>
										<Text fontSize="sm" w="20px">{rating}★</Text>
										<Box flex="1" bg="gray.200" h="20px" borderRadius="md" overflow="hidden">
											<Box
												bg="yellow.400"
												h="100%"
												w={`${(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100}%`}
											/>
										</Box>
										<Text fontSize="sm" w="30px">
											{stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
										</Text>
									</Flex>
								))}
							</Box>
						</Flex>
					</Card.Body>
				</Card.Root>
			)}

			{/* Lista recenzji */}
			{reviews.length === 0 ? (
				<Box textAlign="center" py={10}>
					<Text color="gray.500" fontSize="lg">No reviews yet</Text>
				</Box>
			) : (
				<Stack gap={4}>
					{reviews.map((review) => (
						<Card.Root key={review._id} p={4} borderWidth="1px" borderRadius="lg">
							<Card.Body>
								<Flex justify="space-between" align="start" mb={3}>
									<Box>
										<Flex align="center" gap={3}>
											<Text fontWeight="bold" fontSize="lg">
												Anonymous Patient
											</Text>
											<Badge colorPalette="blue">
												{review.rating}/5
											</Badge>
										</Flex>
										{renderStars(review.rating)}
									</Box>
									<Text fontSize="sm" color="gray.500">
										{formatDate(review.createdAt)}
									</Text>
								</Flex>
								<Text color="gray.700" lineHeight="1.6">
									{review.comment}
								</Text>
							</Card.Body>
						</Card.Root>
					))}
				</Stack>
			)}
		</Box>
	);
};

export default ReviewsPage;
