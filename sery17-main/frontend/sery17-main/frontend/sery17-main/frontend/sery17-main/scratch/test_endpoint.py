import asyncio
import httpx

async def test():
    # Login as admin to get token
    async with httpx.AsyncClient() as client:
        # We need a token. Or we can just use the python script to simulate the function.
        pass

if __name__ == '__main__':
    asyncio.run(test())
