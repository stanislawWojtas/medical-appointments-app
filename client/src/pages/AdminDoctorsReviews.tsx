import { Box, Heading, Stack, Text, Flex, Badge, Spinner, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { DoctorWithReviews } from "../services/IDataProvider";
import * as consultationService from "../services/consultationService";

const AdminDoctorsReviews = () => {
	const [doctorsWithReviews, setDoctorsWithReviews] = useState<DoctorWithReviews[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

	const fetchDoctorsWithReviews = async () => {
		try {
			const data = await consultationService.getAllDoctorsWithReviews();
			setDoctorsWithReviews(data);
		} catch (error) {
			setError((error as Error).message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteReview = async (reviewId: string) => {
		if (!confirm('Are you sure you want to delete this review?')) {
			return;
		}

		setDeletingReviewId(reviewId);
		setError('');
		setSuccessMessage('');
		
		try {
			await consultationService.deleteReview(reviewId);
			setSuccessMessage('Review deleted successfully');
			await fetchDoctorsWithReviews();
		} catch (error) {
			setError((error as Error).message);
		} finally {
			setDeletingReviewId(null);
		}
	};

	useEffect(() => {
		fetchDoctorsWithReviews();
	}, []);

	return (
		<Box p={6}>
			<Heading mb={6}>Doctors and Reviews</Heading>

			{error && (
				<Box p={4} mb={4} bg="red.100" borderRadius="md" color="red.800">
					{error}
				</Box>
			)}

			{successMessage && (
				<Box p={4} mb={4} bg="green.100" borderRadius="md" color="green.800">
					{successMessage}
				</Box>
			)}

			<Box p={6} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
				{isLoading ? (
					<Flex justify="center" p={4}>
						<Spinner size="lg" />
					</Flex>
				) : doctorsWithReviews.length === 0 ? (
					<Text>No doctors found.</Text>
				) : (
					<Stack gap={6}>
						{doctorsWithReviews.map((doctor) => (
							<Box key={doctor.id} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
								<Flex justify="space-between" align="center" mb={3}>
									<Box>
										<Heading size="sm">
											Dr. {doctor.firstName} {doctor.lastName}
										</Heading>
										<Text fontSize="sm" color="gray.600">
											{doctor.specialization} • ${doctor.pricePerVisit}/visit
										</Text>
									</Box>
									<Badge colorScheme="blue">
										{doctor.reviews.length} {doctor.reviews.length === 1 ? 'Review' : 'Reviews'}
									</Badge>
								</Flex>

								<Box borderTopWidth="1px" my={3} />

								{doctor.reviews.length === 0 ? (
									<Text color="gray.500" fontSize="sm">No reviews yet.</Text>
								) : (
									<Stack gap={3}>
										{doctor.reviews.map((review) => (
											<Box key={review._id} p={3} bg="white" borderRadius="md" borderWidth="1px">
												<Flex justify="space-between" mb={2}>
													<Text fontSize="sm" fontWeight="bold">
														{typeof review.patientId === 'object' ? (review.patientId as { email?: string })?.email || 'Anonymous' : 'Anonymous'}
													</Text>
													<Flex align="center" gap={2}>
														<Flex align="center" gap={1}>
															<Text fontSize="sm" fontWeight="bold" color="orange.500">
																{review.rating}/5
															</Text>
															<Text fontSize="lg">⭐</Text>
														</Flex>
														<Button
															size="xs"
															colorPalette="red"
															onClick={() => handleDeleteReview(review._id)}
														>
															Delete
														</Button>
													</Flex>
												</Flex>
												<Text fontSize="sm">{review.comment}</Text>
												<Text fontSize="xs" color="gray.500" mt={1}>
													{new Date(review.createdAt).toLocaleString()}
												</Text>
											</Box>
										))}
									</Stack>
								)}
							</Box>
						))}
					</Stack>
				)}
			</Box>
		</Box>
	);
};

export default AdminDoctorsReviews;
