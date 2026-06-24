class CameraController {
    Client!: {
        RenderCFrame: CFrame;
        Speed: Vector3;
        Config: { CameraOffset: number };
        ToGlobal(v: Vector3): Vector3;
    };

    update(DeltaTime: number) {
        const RenderCFrame = this.Client.RenderCFrame;
        const BaseTargetCenter = RenderCFrame.Position.add(RenderCFrame.UpVector.mul(this.Client.Config.CameraOffset));
        const Speed = this.Client.ToGlobal(this.Client.Speed).mul(-0.5);
        const TargetOffset = Speed.Unit.mul(math.clamp(Speed.Magnitude, 0, 3));
        const Force = 2 / 0.15;
        const Force2 = Force * DeltaTime;
        const Exp = 1 / (1 + Force2 + 0.48 * Force2 ** 2 + 0.235 * Force2 ** 3);
    }
}
