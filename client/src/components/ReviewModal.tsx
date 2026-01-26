import {
	DialogRoot,
	DialogBackdrop,
	DialogContent,
	DialogHeader,
	DialogBody,
	DialogFooter,
	DialogCloseTrigger,
	DialogPositioner,
	Button,
	Textarea,
	VStack,
	Text,
	Box,
	Flex
} from "@chakra-ui/react";
import { useState } from "react";
import { createReview } from "../services/consultationService";
import type { Appointment } from "../models/Appointment";

interface ReviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	appointment: Appointment;
	onSuccess?: () => void;
}

const ReviewModal = ({ isOpen, onClose, appointment, onSuccess }: ReviewModalProps) => {
	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [comment, setComment] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (rating === 0) {
			alert("Please select a rating");
			return;
		}

		if (!comment.trim()) {
			alert("Please write a comment");
			return;
		}

		setIsSubmitting(true);
		try {
			await createReview(appointment.id, rating, comment.trim());

			alert("Review submitted successfully!");
			setRating(0);
			setComment("");
			onClose();
			if (onSuccess) {
				onSuccess();
			}
		} catch (error: unknown) {
			console.error("Error submitting review:", error);
			const errorMessage = error && typeof error === 'object' && 'response' in error
				? (error as { response?: { data?: { message?: string } } }).response?.data?.message
				: "Failed to submit review";
			alert(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderStars = () => {
		return (
			<Flex gap={2} justify="center">
				{[1, 2, 3, 4, 5].map((star) => (
					<Box
						key={star}
						cursor="pointer"
						fontSize="2xl"
						color={star <= (hoveredRating || rating) ? "yellow.400" : "gray.300"}
						onClick={() => setRating(star)}
						onMouseEnter={() => setHoveredRating(star)}
						onMouseLeave={() => setHoveredRating(0)}
					>
						★
					</Box>
				))}
			</Flex>
		);
	};

	return (
		<DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
			<DialogBackdrop />
			<DialogPositioner>
				<DialogContent>
					<DialogHeader>Add Review</DialogHeader>
					<DialogCloseTrigger />
					<DialogBody>
						<VStack gap={4} align="stretch">
							<Box>
								<Text fontWeight="bold" mb={2}>
									Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
								</Text>
								<Text fontSize="sm" color="gray.600">
									{appointment.doctor?.specialization}
								</Text>
							</Box>

							<Box>
								<Text mb={2} fontWeight="medium">
									Rating:
								</Text>
								{renderStars()}
								{rating > 0 && (
									<Text textAlign="center" mt={1} fontSize="sm" color="gray.600">
										{rating} out of 5 stars
									</Text>
								)}
							</Box>

							<Box>
								<Text mb={2} fontWeight="medium">
									Comment:
								</Text>
								<Textarea
									value={comment}
									onChange={(e) => setComment(e.target.value)}
									placeholder="Share your experience with this doctor..."
									rows={5}
									maxLength={1000}
								/>
								<Text fontSize="xs" color="gray.500" mt={1}>
									{comment.length}/1000 characters
								</Text>
							</Box>
						</VStack>
					</DialogBody>
					<DialogFooter>
						<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button
							colorPalette="blue"
							onClick={handleSubmit}
							disabled={isSubmitting || rating === 0}
						>
							{isSubmitting ? "Submitting..." : "Submit Review"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogPositioner>
		</DialogRoot>
	);
};

export default ReviewModal;
