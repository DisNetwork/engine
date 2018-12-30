export async function wait(ms: number) {
    return new Promise((resolve: any) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
