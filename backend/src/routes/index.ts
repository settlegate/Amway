import { Router } from 'express';

import chatRoutes from './chat';
import productRoutes from './products';
import reminderRoutes from './reminders';
import seminarRoutes from './seminars';
import businessRoutes from './business';
import leadRoutes from './leads';
import consentRoutes from './consent';
import adminRoutes from './admin';
import kakaoRoutes from './kakao';
import homePromotionRoutes from './homePromotion';
import { adminLogin, requireAdmin } from '../lib/auth';
import { chatLimiter, imageChatLimiter, kakaoWebhookLimiter } from '../lib/rateLimit';

const router = Router();

router.post('/admin/login', adminLogin);

router.use('/chat', chatLimiter, imageChatLimiter, chatRoutes);
router.use('/products', productRoutes);
router.use('/reminders', reminderRoutes);
router.use('/seminars', seminarRoutes);
router.use('/business', businessRoutes);
router.use('/leads', requireAdmin, leadRoutes);
router.use('/consent', consentRoutes);
router.use('/admin', requireAdmin, adminRoutes);
router.use('/kakao/send', requireAdmin);
router.use('/kakao/webhook', kakaoWebhookLimiter);
router.use('/kakao', kakaoRoutes);
router.use('/home-promotion', homePromotionRoutes);

export default router;
