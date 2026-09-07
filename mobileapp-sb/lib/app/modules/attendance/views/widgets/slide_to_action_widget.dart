import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

// ponytail: lightweight native slider without external dependencies
class SlideToActionWidget extends StatefulWidget {
  final String text;
  final VoidCallback onSlideComplete;
  final IconData thumbIcon;

  const SlideToActionWidget({
    super.key,
    this.text = 'Geser untuk Pemindaian Wajah',
    required this.onSlideComplete,
    this.thumbIcon = Icons.arrow_forward_rounded,
  });

  @override
  State<SlideToActionWidget> createState() => _SlideToActionWidgetState();
}

class _SlideToActionWidgetState extends State<SlideToActionWidget>
    with SingleTickerProviderStateMixin {
  double _dragPosition = 0.0;
  bool _isCompleted = false;
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _animationController.addListener(() {
      setState(() {
        _dragPosition = _animation.value;
      });
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _onDragUpdate(DragUpdateDetails details, double maxWidth) {
    if (_isCompleted) return;

    setState(() {
      _dragPosition += details.delta.dx;
      if (_dragPosition < 0) {
        _dragPosition = 0;
      }
      
      // thumb width is approx 56 (with padding), so max drag is maxWidth - 56
      final maxDrag = maxWidth - 56.0;
      if (_dragPosition > maxDrag) {
        _dragPosition = maxDrag;
      }
    });
  }

  void _onDragEnd(DragEndDetails details, double maxWidth) {
    if (_isCompleted) return;

    final maxDrag = maxWidth - 56.0;
    
    // If dragged past 80%, trigger complete
    if (_dragPosition >= maxDrag * 0.8) {
      setState(() {
        _dragPosition = maxDrag;
        _isCompleted = true;
      });
      widget.onSlideComplete();
      
      // Reset after a short delay to allow for screen transition
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          setState(() {
            _isCompleted = false;
            _dragPosition = 0.0;
          });
        }
      });
    } else {
      // Spring back to 0
      _animation = Tween<double>(begin: _dragPosition, end: 0.0).animate(
        CurvedAnimation(
          parent: _animationController,
          curve: Curves.easeOutBack,
        ),
      );
      _animationController.forward(from: 0.0);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth;
        
        return Container(
          height: 56,
          decoration: BoxDecoration(
            color: AppColors.redPrimary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
              color: AppColors.redPrimary.withValues(alpha: 0.2),
              width: 1,
            ),
          ),
          child: Stack(
            children: [
              // Gradient Fill when dragging
              if (_dragPosition > 0)
                Container(
                  width: _dragPosition + 56,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    gradient: LinearGradient(
                      colors: [
                        AppColors.redPrimary.withValues(alpha: 0.2),
                        AppColors.redPrimary.withValues(alpha: 0.5),
                      ],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                  ),
                ),
                
              // Background Text
              Align(
                alignment: Alignment.center,
                child: Padding(
                  padding: const EdgeInsets.only(left: 24.0), // offset for thumb
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        widget.text,
                        style: TextStyle(
                          color: AppColors.redPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.keyboard_double_arrow_right,
                        color: AppColors.redPrimary.withValues(alpha: 0.5),
                        size: 20,
                      ),
                    ],
                  ),
                ),
              ),
              
              // Draggable Thumb
              Positioned(
                left: _dragPosition,
                top: 4,
                bottom: 4,
                child: GestureDetector(
                  onHorizontalDragUpdate: (details) => _onDragUpdate(details, maxWidth),
                  onHorizontalDragEnd: (details) => _onDragEnd(details, maxWidth),
                  child: Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.redPrimary,
                    ),
                    child: Center(
                      child: _isCompleted
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Icon(
                              widget.thumbIcon,
                              color: Colors.white,
                              size: 24,
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
