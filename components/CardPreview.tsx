import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  useDisclosure,
  Image,
  Box,
} from '@chakra-ui/react';
import React, { useRef } from 'react';

const THRESHOLD = 30;

export const CardPreview = ({ src }: { src: string }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || !shineRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    cardRef.current.style.transform = `perspective(900px)
    rotateX(${(-y / THRESHOLD).toFixed(2)}deg)
    rotateY(${(x / THRESHOLD).toFixed(2)}deg)
    scale(1.05)
    `;

    shineRef.current.style.background = `
  radial-gradient(
    circle at ${e.clientX - rect.left}px ${e.clientY - rect.top}px,
    rgba(255,255,255,0.28),
    rgba(255,255,255,0.12) 20%,
    transparent 60%
  )
`;
  };

  const resetTransform = () => {
    if (!cardRef.current || !shineRef.current) return;

    cardRef.current.style.transform =
      'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';

    shineRef.current.style.background = 'none';
  };

  return (
    <>
      <Image
        src={src}
        onClick={onOpen}
        cursor="pointer"
        className="h-auto w-full rounded-sm transition-transform hover:scale-105"
      />

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="auto">
        <ModalOverlay />

        <ModalContent
          borderRadius="md"
          overflow="hidden"
          width="fit-content"
          maxW="90vw"
        >
          <ModalHeader className="border-b-4 border-b-blue700 text-lg font-bold">
            Card Preview
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody className="flex items-center justify-center p-2 md:p-4">
            <Box
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={resetTransform}
              className="relative transition-transform duration-200 ease-out"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Image
                src={src}
                className="max-h-[75vh] w-auto rounded-md"
                objectFit="contain"
              />

              <Box
                ref={shineRef}
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                pointerEvents="none"
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
