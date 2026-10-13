"""
Encodes all 300 Coca-Cola frames into a smooth, high-definition MP4 video (1080p, 30fps).
"""
import os
import subprocess
import imageio_ffmpeg

def generate_mp4():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frames_dir = os.path.join(base_dir, 'frames')
    output_mp4 = os.path.join(base_dir, 'coca_animation.mp4')
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    print(f"FFmpeg binary: {ffmpeg_exe}")
    print(f"Frames directory: {frames_dir}")
    print(f"Target video: {output_mp4}")

    input_pattern = os.path.join(frames_dir, 'ezgif-frame-%03d.jpg')

    # Run FFmpeg command: 30 FPS, H.264 video codec, faststart for streaming web playback
    cmd = [
        ffmpeg_exe,
        '-y',
        '-framerate', '30',
        '-i', input_pattern,
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-level:v', '4.2',
        '-pix_fmt', 'yuv420p',
        '-crf', '18',
        '-movflags', '+faststart',
        output_mp4
    ]

    print("Executing command:", " ".join(cmd))
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
        print(f"SUCCESS! Created MP4 video: {output_mp4} ({size_mb:.2f} MB)")
    else:
        print("FFmpeg failed:")
        print(res.stderr)

if __name__ == '__main__':
    generate_mp4()
