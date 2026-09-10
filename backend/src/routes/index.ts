import { Router } from 'express';

import chatRoutes from './chat';
import bodyRoutes from './body';
import productRoutes from './products';
import reminderRoutes from './reminders';
import seminarRoutes from './seminars';
import businessRoutes from './business';
import leadRoutes from './leads';
import consentRoutes from './consent';
import adminRoutes from './admin';
import kakaoRoutes from './kakao';
import homePromotionRoutes from './homePromotion';

const router = Router();

router.use('/chat', chatRoutes);
router.use('/body', bodyRoutes);
router.use('/products', productRoutes);
router.use('/reminders', reminderRoutes);
router.use('/seminars', seminarRoutes);
router.use('/business', businessRoutes);
router.use('/leads', leadRoutes);
router.use('/consent', consentRoutes);
router.use('/admin', adminRoutes);
router.use('/kakao', kakaoRoutes);
router.use('/home-promotion', homePromotionRoutes);

export default router;
